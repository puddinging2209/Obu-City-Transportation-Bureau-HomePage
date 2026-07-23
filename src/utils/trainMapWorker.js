import linesData from '../data/lines.json';
import stationsData from '../data/stations.json';

const stations = Object.values(stationsData)
const lineCodeNameMap = Object.fromEntries(Object.values(linesData).reverse().map(l => [l.code, l.name]))

const trains = new Set()

function normalizeSec(sec) {
	const rest = sec % (24 * 60 * 60)
	if (3 * 60 * 60 <= rest) {
		return rest
	}
	return rest + 24 * 60 * 60
}

const getTrainTimeRange = (train) => {
	const timetable = train.timetable
	const startAt = normalizeSec(timetable._data[timetable.firstStationIndex].departure)
	const endAt = normalizeSec(timetable._data[timetable.terminalStationIndex].arrival)
	return [startAt, endAt]
}

const stationIdCache = new Map()
const getStationId = (numbering) => {
	if (stationIdCache.has(numbering)) return stationIdCache.get(numbering)
	const id = stations.find(s => s.code.includes(numbering) || s.name === numbering)?.id
	stationIdCache.set(numbering, id)
	return id
}

const searchStops = (train, lineCode) => {
	return train.timetable._data
		.map((sta, i) => {
			if (!sta) {
				return null
			}
			const stationId = sta.stationId;
			if (!sta || !stationId) return null;
			if (lineCode == 'KT' && stationId === 'chr') return null;
			if (lineCode == 'MR' && (stationId === 'okw' || stationId === 'hno')) return null;
			if (lineCode == 'NK' && (stationId === 'kyw' || stationId === 'tmo')) return null;
			if (![1, 2].includes(sta.stopType)) {
				return null
			}
			return {
				id: stationId,
				stopType: sta.stopType === 1 ? 'stop' : 'pass',
				arr: sta.arrival ?? null,
				dep: sta.departure ?? null,
				lineName: sta.lineName,
			};
		})
		.filter((sta) => sta !== null);
}

const formatStops = (trains) => {
	const sorted = trains.sort((a, b) => getTrainTimeRange(a.train)[0] - getTrainTimeRange(b.train)[0])
	const timetables = sorted.flatMap(t => searchStops(t.train, t.lineCode))
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
		} else if ((timetables[i].id === 'obu' || timetables[i].id === 'ktk') && timetables[i].stopType === 'pass') {
			continue;
		} else if (
			linesData[timetables[i].lineName]?.code === 'KT' &&
			timetables.some((sta) => sta.id === 'obu' && sta.stopType === 'stop') &&
			['obm', 'krn', 'wks'].includes(timetables[i].id) &&
			timetables[i].stopType === 'pass'
		) {
			continue;
		} else result.push(timetables[i]);
	}

	return result;
}

const setTrains = ouds => {
	const trainsGroupByNumber = {}
	for (const oud of ouds) {
		for (const train of oud.railway.diagrams[0].trains.flat()) {
			train.timetable._data.forEach((d, i) => {
				if (d) {
					d.stationId = getStationId(
						oud.railway.stations.at(i * (train.direction ? -1 : 1) - train.direction).name
					)
					d.lineName = lineCodeNameMap[oud.railway.name]
				}
			})
			const number = train.number || Math.random()
			trainsGroupByNumber[number] ??= []
			trainsGroupByNumber[number].push({
				train,
				lineCode: oud.railway.name,
				type: oud.railway.trainTypes[train.type].name
			})
		}
	}
	for (const [number, train] of Object.entries(trainsGroupByNumber)) {
		const stops = formatStops(train)
		if(!stops.length) {
			continue
		}
		trains.add({
			stops,
			type: train[0].type,
			number,
			startAt: normalizeSec(stops[0].dep),
			endAt: normalizeSec(stops.at(-1).arr)
		})
	}
}

self.addEventListener('message', ({ data }) => {
	switch (data.type) {
		case 'setOuds': {
			if (!data.ouds) {
				break
			}
			setTrains(data.ouds)
			break
		}

		default:
			break
	}
})
