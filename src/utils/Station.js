import nodes from '../data/nodes.json';
import stations from '../data/stations.json';

export function name_number(text) {
	if (text === '中部国際空港') return ['HK28'];
	return Object.values(stations).find((s) => s.id === id(text))?.code[0] ?? null;
}

export function id_number(id) {
	return stations[id]?.code[0] ?? null;
}

export function name(text) {
	if (nodes[text]) {
		return nodes[text].name;
	} else if (stations[text]) return stations[text].name;
	else if (Object.values(stations).find((s) => s.name === text)) return text;
	return null;
}

export function label(text) {
	if (name(text) != null) {
		return name(text);
	} else if (text === '空港') return '中部国際空港';
	return text;
}

export function code(text) {
	if (name_number(text)) return name_number(text);
	else if (text == '中部国際空港') return 'HK28';
	else if (stations[text]) return stations[text].code[0];
	else if (Object.keys(nodes).includes(text)) return text;
	return null;
}

export function id(text) {
	if (nodes[text]) return nodes[text].id;
	else if (Object.values(stations).find((s) => s.name === text)) return Object.values(stations).find((s) => s.name === text).id;
	else if (Object.keys(stations).includes(text)) return text;
	else if (text == '中部国際空港') return 'ct2';
	return null;
}
