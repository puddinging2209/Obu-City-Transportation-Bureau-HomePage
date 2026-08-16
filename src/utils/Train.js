import { id, label } from './Station.js';

export function terminal(train, diagram) {
	const station_list = diagram.railway.stations.map((sta) => id(sta.name));

	const terminalOperation = train.operations.find((op) => op.outerType === 'A');
	let result = '';
	if (terminalOperation) {
		result =
			diagram.railway.stations[
				train.direction === 0 ? terminalOperation.stationIndex : station_list.length - 1 - terminalOperation.stationIndex
			].outerTerminal[terminalOperation.terminalStationIndex].name;
	} else {
		result =
			station_list[
				train.direction === 0 ? train.timetable.terminalStationIndex : station_list.length - 1 - train.timetable.terminalStationIndex
			];
	}
	if (result === 'セントレア第2ターミナル') return '中部国際空港';
	if (result.includes('大府環状線')) return '大府環状線';
	return label(result);
}

/**
 * 列車の種別名(日本名)を返す
 * @param {Object} train 列車オブジェクト
 * @param {Object} diagram ダイヤグラム
 * @param {string} station 駅名(その駅地点での種別(種別変更を考慮))
 * @returns {string} 種別名
 */
export function typeName(train, diagram, station = null) {
	const typeToNormalized = (type) => {
		if (type === '普通 ') return '普通';
		if (type === 'たこつぼ') return '特急';
		return type;
	};

	const notes = train.note.split(',');
	let type = typeToNormalized(diagram.railway.trainTypes[train.type].name);
	notes.forEach((note) => {
		if (train.note?.match(/から|まで/)) {
			const border = train.note.includes('まで') ? 'to' : 'from';
			const typeChange = {
				sta: note.split(/から|まで/)[0].trim(),
				type: note.split(/から|まで/)[1].trim(),
				mode: border,
			};
			const staIndex = diagram.railway.stations.findIndex((sta) => id(sta.name) === id(station));
			const changeStaIndex = diagram.railway.stations.findIndex((sta) => id(sta.name) === id(typeChange.sta));
			if (staIndex !== -1 && changeStaIndex !== -1) {
				if (train.direction === 0 ? staIndex < changeStaIndex : staIndex > changeStaIndex) {
					if (typeChange.mode === 'to') {
						type = typeToNormalized(typeChange.type);
					}
				} else {
					if (typeChange.mode === 'from') {
						type = typeToNormalized(typeChange.type);
					}
				}
			}
		}
	});

	return type;
}
