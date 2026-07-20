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
			exc: { station: 'obu', direction: { route: '大府環状線', stationName: '江端町' } },
			return: 12,
		},
		{
			exc: { station: 'hdk', direction: { route: '刈谷環状線', stationName: '刈谷青山' } },
			return: 17,
		},
		{
			exc: { station: 'shg', direction: { route: '名東線', stationName: '藤が丘' } },
			return: 0,
		},
		{
			exc: {
				station: 'dtc',
				direction: { route: '二ツ池線森岡支線', stationName: '於大公園西' },
			},
			return: 8,
		},
		{
			exc: { station: 'nrm', direction: { route: '鳴海連絡線', stationName: '上汐田' } },
			return: 1,
		},
		{
			exc: { station: 'kso', direction: { route: '鳴海連絡線', stationName: '鳴海' } },
			return: 0,
		},
		{
			exc: { station: 'ebt', direction: { route: '大峯連絡線', stationName: '半田市' } },
			return: 0,
		},
		{
			exc: { station: 'okw', direction: { route: '半田線', stationName: '大府' } },
			return: 17,
		},
		{
			exc: { station: 'okw', direction: { route: '半田線住吉支線', stationName: '清城' } },
			return: 17,
		},
		{
			exc: {
				station: 'tmo',
				direction: { route: '南港線(名港トリトンライン)', stationName: '湾岸長島' },
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
			exc: { station: 'ebt', direction: { route: '大府環状線', stationName: '大府' } },
			return: 'OL01a',
		},
		{
			exc: { station: 'omn', direction: { route: '大府環状線', stationName: '大府' } },
			return: 'OL01a',
		},
		{
			exc: {
				station: 'akr',
				direction: { route: '半田線住吉支線', stationName: '乙川' },
			},
			return: 'HD17a',
		},
		{
			exc: { station: 'smy', direction: { route: '半田線住吉支線', stationName: '乙川' } },
			return: 'HD17a',
		},
		{
			exc: { station: 'sis', direction: { route: '半田線住吉支線', stationName: '乙川' } },
			return: 'HD17a',
		},
		{
			exc: { station: 'kso', direction: { route: '鳴海連絡線', stationName: '鳴海' } },
			return: 'GK04a',
		},
		{
			exc: { station: 'nrm', direction: { route: '鳴海連絡線', stationName: '上汐田' } },
			return: 'OD14a',
		},
		{
			exc: { station: 'obm', direction: { route: '大峯連絡線', stationName: '江端町' } },
			return: 'OL11a',
		},
	];

	const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ station, direction }));
	if (exception) {
		return exception.return;
	}

	return name_number(direction.stationName.split('・')[0]).find((value) => value.includes(rosen));
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

async function searchDeparture(sta, direction) {
	const station = sta.id;
	const diagram = await dia(lines[direction.route].json);
	const rosen = lines[direction.route].code;
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
		if (direction.route === '刈田川急行線' && ['hnt', 'dtc', 'sos'].includes(station)) {
			departures = departures.filter((tra) => tra.timetable._data[9]?.stopType === 1);
		} else if (direction.route === '刈田川線' && direction.stationName.includes('若草')) {
			departures = departures.filter((tra) => tra.timetable._data[9]?.stopType !== 1);
		}
	} else if (rosen === 'HD') {
		if (direction.route === '半田線' && station === 'obm' && direction.stationName === '大府') {
			departures = departures.filter((tra) => tra.timetable._data[d === 0 ? 1 : 28]?.stopType === 1);
		} else if (direction.route === '大峯連絡線' && station === 'obm') {
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
