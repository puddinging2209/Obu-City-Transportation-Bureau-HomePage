import lines from '../data/lines.json';
import { id_number, name_number } from './Station.js';
import { adjustTime } from './Time.js';
import { terminal, typeName } from './Train.js';
import { fetchOud } from './oudFileLoader.js';

let dias = {};

export function resolveRosen(rosen) {
	if (lines?.[rosen]) return lines[rosen].json;

	const found = Object.values(lines).find((l) => l.code === rosen);
	if (found) return found.json;

	return rosen;
}

/**
 * ダイヤグラムを読み込む
 * @param {string} rosen
 * @returns {Promise<Object>} ダイヤグラムオブジェクト
 */
export async function dia(rosen) {
	const code = resolveRosen(rosen);

	if (dias[code]) return dias[code];

	const diagram = await fetchOud(code);
	dias[code] = diagram;
	return diagram;
}

function indexofFromStation(diagram, station, rosen, direction) {
	const exceptions = [
		{
			exc: { station: 'obu', direction: { line: '大府環状線', id: 'ebt' } },
			return: 12,
		},
		{
			exc: { station: 'hdk', direction: { line: '刈谷環状線', id: 'kra' } },
			return: 17,
		},
		{
			exc: { station: 'shg', direction: { line: '名東線', id: 'fjg' } },
			return: 0,
		},
		{
			exc: {
				station: 'dtc',
				direction: { line: '二ツ池線森岡支線', id: 'odn' },
			},
			return: 8,
		},
		{
			exc: { station: 'nrm', direction: { line: '鳴海連絡線', id: 'kso' } },
			return: 1,
		},
		{
			exc: { station: 'kso', direction: { line: '鳴海連絡線', id: 'nrm' } },
			return: 0,
		},
		{
			exc: { station: 'ebt', direction: { line: '大峯連絡線', id: 'hns' } },
			return: 0,
		},
		{
			exc: { station: 'okw', direction: { line: '半田線', id: 'obu' } },
			return: 17,
		},
		{
			exc: { station: 'okw', direction: { line: '半田線住吉支線', id: 'sis' } },
			return: 17,
		},
		{
			exc: {
				station: 'tmo',
				direction: { line: '南港線(名港トリトンライン)', id: 'wng' },
			},
			return: 0,
		},
	];

	const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ station, direction }));
	if (exception) {
		return exception.return;
	}

	return diagram.railway.stations.findIndex((sta) => sta.name == id_number(station).find((value) => value.includes(rosen)));
}

function codeofToStation(station, direction, rosen) {
	const exceptions = [
		{
			exc: { station: 'ebt', direction: { line: '大府環状線', id: 'obu' } },
			return: 'OL01a',
		},
		{
			exc: { station: 'omn', direction: { line: '大府環状線', id: 'obu' } },
			return: 'OL01a',
		},
		{
			exc: {
				station: 'akr',
				direction: { line: '半田線住吉支線', id: 'okw' },
			},
			return: 'HD17a',
		},
		{
			exc: { station: 'smy', direction: { line: '半田線住吉支線', id: 'okw' } },
			return: 'HD17a',
		},
		{
			exc: { station: 'sis', direction: { line: '半田線住吉支線', id: 'okw' } },
			return: 'HD17a',
		},
		{
			exc: { station: 'kso', direction: { line: '鳴海連絡線', id: 'nrm' } },
			return: 'GK04a',
		},
		{
			exc: { station: 'nrm', direction: { line: '鳴海連絡線', id: 'kso' } },
			return: 'OD14a',
		},
		{
			exc: { station: 'obm', direction: { line: '大峯連絡線', id: 'ebt' } },
			return: 'OL11a',
		},
	];

	const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ station, direction }));
	if (exception) {
		return exception.return;
	}

	return name_number(direction.id.split('・')[0]).find((value) => value.includes(rosen));
}

function mergeMultilayerTrain(deps) {
	let result = [];
	for (let i = 0; i < deps.length; i++) {
		const dep = deps[i];
		if (
			i < deps.length - 1 &&
			Math.abs(Number(deps[i].train.number) - Number(deps[i + 1].train.number)) === 100 &&
			deps[i].time === deps[i + 1].time
		) {
			if (deps[i].terminal !== deps[i + 1].terminal)
				result.push({
					...dep,
					terminal: `${dep.terminal}・${deps[i + 1].terminal}`,
					multilayer: true,
					train: [dep.train, deps[i + 1].train],
				});
			else
				result.push({
					...dep,
					multilayer: false,
					train: dep.train,
				});
		} else if (i > 0 && Math.abs(Number(deps[i - 1].train.number) - Number(deps[i].train.number)) === 100 && deps[i - 1].time === deps[i].time) {
			continue;
		} else result.push(dep);
	}
	return result;
}

/**
 * 駅と方向から発車案内を取得
 * 	@param {string} station 駅id
 * 	@param {{line: string, id: string}} direction 方向
 */
async function searchDeparture(station, direction) {
	const diagram = await dia(lines[direction.line].json);
	const rosen = lines[direction.line].code;
	const stationIndex = indexofFromStation(diagram, station, rosen, direction);
	const toCode = codeofToStation(station, direction, rosen);
	const numofStations = diagram.railway.stations.length;
	const d = stationIndex < diagram.railway.stations.findIndex((sta) => sta.name == toCode) ? 0 : 1;
	let departures = diagram.railway.diagrams[0].trains[d].filter(
		(tra) =>
			tra.timetable._data[d === 0 ? stationIndex : numofStations - 1 - stationIndex]?.stopType === 1 &&
			tra.timetable._data[d === 0 ? stationIndex : numofStations - 1 - stationIndex]?.departure !== undefined &&
			tra.timetable._data[d === 0 ? stationIndex + 1 : numofStations - stationIndex],
	);
	if (rosen === 'KT') {
		if (direction.line === '刈田川急行線' && station !== 'obu') {
			departures = departures.filter((tra) => tra.timetable._data[9]?.stopType === 1);
		} else if (direction.line === '刈田川線' && ((station === 'hnt' && d === 0) || (['dtc', 'sos'].includes(station) && d === 1))) {
			departures = departures.filter((tra) => tra.timetable._data[9]?.stopType !== 1);
		}
	} else if (rosen === 'HD') {
		if (direction.line === '半田線' && station === 'obm' && direction.id === 'obu') {
			departures = departures.filter((tra) => tra.timetable._data[d === 0 ? 1 : 28]?.stopType === 1);
		} else if (direction.line === '大峯連絡線' && station === 'obm') {
			departures = departures.filter((tra) => tra.timetable._data[d === 0 ? 1 : 28]?.stopType !== 1);
		}
	}
	const result = departures
		.map((tra) => {
			const time = tra.timetable._data[d === 0 ? stationIndex : numofStations - 1 - stationIndex]?.departure;
			return {
				terminal: terminal(tra, diagram),
				typeName: typeName(tra, diagram),
				time: adjustTime(time),
				multilayer: false,
				train: tra,
			};
		})
		.sort((a, b) => adjustTime(a.time) - adjustTime(b.time));
	return mergeMultilayerTrain(result);
}
export { searchDeparture };
