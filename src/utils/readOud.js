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
			exc: { station: 'obu', direction: { line: '大府環状線', id: '江端町' } },
			return: 12,
		},
		{
			exc: { station: 'hdk', direction: { line: '刈谷環状線', id: '刈谷青山' } },
			return: 17,
		},
		{
			exc: { station: 'shg', direction: { line: '名東線', id: '藤が丘' } },
			return: 0,
		},
		{
			exc: {
				station: 'dtc',
				direction: { line: '二ツ池線森岡支線', id: '於大公園西' },
			},
			return: 8,
		},
		{
			exc: { station: 'nrm', direction: { line: '鳴海連絡線', id: '上汐田' } },
			return: 1,
		},
		{
			exc: { station: 'kso', direction: { line: '鳴海連絡線', id: '鳴海' } },
			return: 0,
		},
		{
			exc: { station: 'ebt', direction: { line: '大峯連絡線', id: '半田市' } },
			return: 0,
		},
		{
			exc: { station: 'okw', direction: { line: '半田線', id: '大府' } },
			return: 17,
		},
		{
			exc: { station: 'okw', direction: { line: '半田線住吉支線', id: '清城' } },
			return: 17,
		},
		{
			exc: {
				station: 'tmo',
				direction: { line: '南港線(名港トリトンライン)', id: '湾岸長島' },
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
			exc: { station: 'ebt', direction: { line: '大府環状線', id: '大府' } },
			return: 'OL01a',
		},
		{
			exc: { station: 'omn', direction: { line: '大府環状線', id: '大府' } },
			return: 'OL01a',
		},
		{
			exc: {
				station: 'akr',
				direction: { line: '半田線住吉支線', id: '乙川' },
			},
			return: 'HD17a',
		},
		{
			exc: { station: 'smy', direction: { line: '半田線住吉支線', id: '乙川' } },
			return: 'HD17a',
		},
		{
			exc: { station: 'sis', direction: { line: '半田線住吉支線', id: '乙川' } },
			return: 'HD17a',
		},
		{
			exc: { station: 'kso', direction: { line: '鳴海連絡線', id: '鳴海' } },
			return: 'GK04a',
		},
		{
			exc: { station: 'nrm', direction: { line: '鳴海連絡線', id: '上汐田' } },
			return: 'OD14a',
		},
		{
			exc: { station: 'obm', direction: { line: '大峯連絡線', id: '江端町' } },
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
			tra.timetable._data[d === 0 ? stationIndex : numofStations - 1 - stationIndex]?.departure != null &&
			tra.timetable._data[d === 0 ? stationIndex + 1 : numofStations - stationIndex] != null,
	);
	if (rosen === 'KT') {
		if (direction.line === '刈田川急行線' && ['hnt', 'dtc', 'sos'].includes(station)) {
			departures = departures.filter((tra) => tra.timetable._data[9]?.stopType === 1);
		} else if (direction.line === '刈田川線' && direction.id === 'wks') {
			departures = departures.filter((tra) => tra.timetable._data[9]?.stopType !== 1);
		}
	} else if (rosen === 'HD') {
		if (direction.line === '半田線' && station === 'obm' && direction.id === 'obu') {
			departures = departures.filter((tra) => tra.timetable._data[d === 0 ? 1 : 28]?.stopType === 1);
		} else if (direction.line === '大峯連絡線' && station === 'obm') {
			departures = departures.filter((tra) => tra.timetable._data[d === 0 ? 1 : 28]?.stopType === 2);
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
