import linesData from '../../data/lines.json';
import lineShapeData from '../../data/lineShape.json';
import routesData from '../../data/routes.json';
import stationsData from '../../data/stations.json';
import typesData from '../../data/types.json';

const typeExceptions = {
	'普通 ': '普通',
	たこつぼ: '特急',
};

const typePriorities = Object.fromEntries(Object.keys(typesData).map((d, i) => [d, i]));

const stations = Object.values(stationsData);
const lineCodeNameMap = Object.fromEntries(
	Object.values(linesData)
		.reverse()
		.map((l) => [l.code, l.name]),
);

let trains = null;

function normalizeSec(sec) {
	if (sec === null) {
		return null;
	}
	const rest = sec % (24 * 60 * 60);
	if (3 * 60 * 60 <= rest) {
		return rest;
	}
	return rest + 24 * 60 * 60;
}

/**
 * 路線内の始発時刻と終着時刻を返す
 * @param {Train} train 列車オブジェクト
 * @returns {[number, number]} [始発時刻, 終着時刻]
 */
const getTrainTimeRange = (train) => {
	const timetable = train.timetable;
	const startAt = normalizeSec(timetable._data[timetable.firstStationIndex].departure);
	const endAt = normalizeSec(timetable._data[timetable.terminalStationIndex].arrival ?? timetable._data[timetable.terminalStationIndex].departure);
	return [startAt, endAt, (startAt + endAt) / 2];
};

const stationIdCache = new Map();
const getStationId = (numbering) => {
	if (stationIdCache.has(numbering)) return stationIdCache.get(numbering);
	const numberingNormalized = numbering.substring(0, 4);
	const id = stations.find((s) => s.code.includes(numberingNormalized) || s.name === numberingNormalized)?.id;
	stationIdCache.set(numbering, id);
	return id;
};

const searchStops = (train, lineCode) => {
	return train.timetable._data
		.map((sta, i) => {
			const stationId = sta?.stationId;
			if (!sta || !stationId) return null;
			if (lineCode == 'KT' && stationId === 'chr') return null;
			if (lineCode == 'MR' && (stationId === 'okw' || stationId === 'hno')) return null;
			if (lineCode == 'NK' && (stationId === 'kyw' || stationId === 'tmo')) return null;
			if (![1, 2].includes(sta.stopType)) return null;
			return {
				id: stationId,
				stopType: sta.stopType === 1 ? 'stop' : 'pass',
				arr: sta.arrival ?? null,
				dep: sta.departure ?? null,
				lineName: sta.lineName,
			};
		})
		.filter((sta) => sta !== null);
};

const sortTrains = (trains) => {
	const sorted = trains.sort((a, b) => getTrainTimeRange(a.train)[2] - getTrainTimeRange(b.train)[2]);
	for (let i = 0; i < sorted.length; i++) {
		if (sorted[i].train.operations.some((o) => o.outerType === 'A')) {
			if (sorted[i + 1] && !sorted[i + 1].train.operations.some((o) => o.outerType === 'B')) {
				sorted[i].train.timetable._data = [];
			}
		}
		if (sorted[i].train.operations.some((o) => o.outerType === 'B')) {
			if (sorted[i - 1] && !sorted[i - 1].train.operations.some((o) => o.outerType === 'A')) sorted[i].train.timetable._data = [];
		}
	}
	return sorted;
};

const formatStops = (trains) => {
	const sorted = sortTrains(trains);
	const timetables = sorted.flatMap((t) => searchStops(t.train, t.lineCode));
	const result = [];
	for (let i = 0; i < timetables.length; i++) {
		if (i < timetables.length - 2 && timetables[i].id === timetables[i + 1].id) {
			result.push({
				id: timetables[i].id,
				stopType: timetables[i].stopType,
				arr: timetables[i].arr,
				dep: timetables[i + 1].dep,
				lineName: timetables[i].lineName,
			});
		} else if (i > 0 && timetables[i - 1].id === timetables[i].id) {
			continue;
		} else if (timetables[i].id === 'obu' && timetables[i].stopType === 'pass') {
			continue;
		} else if (
			linesData[timetables[i].lineName]?.code === 'KT' &&
			((timetables.some((sta) => sta.id === 'obu' && sta.stopType === 'stop') &&
				['obm', 'krn', 'wks'].includes(timetables[i].id) &&
				timetables[i].stopType === 'pass') ||
				timetables[i].id === 'chr')
		) {
			continue;
		} else if (i > 0 && timetables[i].id === 'kry' && timetables[i].lineName === '刈田川線' && timetables[i - 1].lineName === '外環線')
			result.push({
				...timetables[i],
				lineName: '緒川線',
			});
		else result.push(timetables[i]);
	}

	return result;
};

const setTrains = (ouds) => {
	const trainsGroupByNumber = {};
	const sequenceNumbers = {};
	for (const oud of ouds) {
		const lineCode = oud.railway.name;
		for (const train of oud.railway.diagrams[0].trains.flat()) {
			train.timetable._data.forEach((d, i) => {
				if (d) {
					d.stationId = getStationId(oud.railway.stations.at(i * (train.direction ? -1 : 1) - train.direction).name);
					d.lineName = lineCodeNameMap[oud.railway.name];
					d.arrival = normalizeSec(d.arrival);
					d.departure = normalizeSec(d.departure);
				}
			});
			sequenceNumbers[lineCode] ??= 0;
			const number = train.number || String(lineCode + sequenceNumbers[lineCode]++);
			trainsGroupByNumber[number] ??= [];
			trainsGroupByNumber[number].push({
				train,
				lineCode,
				type: oud.railway.trainTypes[train.type].name,
			});
		}
	}
	const trainsGroupByType = [];
	for (const [number, train] of Object.entries(trainsGroupByNumber)) {
		const stops = formatStops(train);
		if (!stops.length) {
			continue;
		}
		const type = typeExceptions[train[0].type] ?? train[0].type;
		trainsGroupByType[typePriorities[type]] ??= [];
		trainsGroupByType[typePriorities[type]].push({
			stops,
			type,
			number,
			startAt: stops[0].dep,
			endAt: stops.at(-1).arr,
		});
	}
	trains = new Set(trainsGroupByType.flat());
};

const calcPositions = (sec) => {
	const results = [];
	for (const train of trains) {
		if (!(train.startAt <= sec && sec <= train.endAt)) {
			continue;
		}
		const routeReference = routesData.trains[train.number];
		if (!routeReference) {
			continue;
		}
		const routes = routesData.routes[routeReference];
		const segmentData = [];
		let stoppedCount = 0;
		for (const stop of train.stops) {
			segmentData.push(stop);
			if (stop.stopType === 'pass') {
				continue;
			}
			if (stop.arr <= sec && sec <= stop.dep) {
				segmentData.length = 0;
				segmentData.push(stop);
				break;
			}
			if (sec < stop.arr) {
				break;
			}
			if (stop.dep <= sec) {
				segmentData.length = 0;
				segmentData.push(stop);
			}
			stoppedCount++;
		}
		const { targetSegment, targetRate } = (() => {
			const period = segmentData.at(-1).arr - segmentData[0].dep;
			const rate = (sec - segmentData[0].dep) / period;
			// 停車中
			if (segmentData.length === 1) {
				if (!routes[stoppedCount]) {
					return { targetRate: null, targetSegment: null };
				}
				return {
					targetSegment: routes[stoppedCount][0],
					targetRate: 0,
				};
			} /* 移動中 */ else {
				const segmentRoutes = routes[stoppedCount - 1];
				const lengthSum = segmentRoutes.reduce((s, c) => s + c.length, 0);
				const pos = lengthSum * rate;
				let sum = 0;
				for (let i = 0; i < segmentRoutes.length; i++) {
					if (pos <= sum + segmentRoutes[i].length) {
						const remain = pos - sum;
						const targetRate = remain / segmentRoutes[i].length;
						return {
							targetSegment: segmentRoutes[i],
							targetRate,
						};
					}
					sum += segmentRoutes[i].length;
				}
				return { targetRate: null, targetSegment: null };
			}
		})();
		// if (targetRate < 0 || 1 < targetRate)
		if (!targetRate && !targetSegment) {
			continue;
		}
		const lineName = targetSegment.line;
		const lineRate = (targetSegment.to - targetSegment.from) * targetRate + targetSegment.from;
		const shapeData = lineShapeData[lineName];
		const coordinate = (() => {
			for (let i = 1; i < shapeData.length; i++) {
				if (lineRate <= shapeData[i][2]) {
					const remain = lineRate - shapeData[i - 1][2];
					const segmentRate = remain / (shapeData[i][2] - shapeData[i - 1][2]);
					return [
						(shapeData[i][0] - shapeData[i - 1][0]) * segmentRate + shapeData[i - 1][0],
						(shapeData[i][1] - shapeData[i - 1][1]) * segmentRate + shapeData[i - 1][1],
					];
				}
			}
		})();
		results.push({
			...train,
			coordinate,
		});
	}
	return results;
};

self.addEventListener('message', ({ data }) => {
	switch (data.type) {
		case 'setOuds': {
			if (!data.ouds) {
				break;
			}
			setTrains(data.ouds);
			break;
		}
		case 'calcPosition': {
			self.postMessage({
				type: 'calcPositionResult',
				data: calcPositions(normalizeSec(data.sec)),
				sec: data.sec,
			});
		}
		default:
			break;
	}
});
