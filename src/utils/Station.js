import nodes from '../data/nodes.json';
import stations from '../data/stations.json';

export function name_number(text) {
    if (text === '中部国際空港') return ['HK28'];
    return Object.values(stations).find((s) => s.name === text)?.code ?? null;
}

export function id_number(id) {
    console.log(id);
    return stations[id]?.code ?? null;
}

export function name(text) {
    if (nodes[text]) {
        return nodes[text].name;
    } else if (text == '空港') return '中部国際空港';
    else if (stations[text]) return stations[text].name;
    return text;
}

export function code(text) {
    if (name_number(text) != null) {
        return name_number(text);
    } else if (text == '中部国際空港') return 'HK28';
    else if (stations[text]) return stations[text].code[0];
    return text;
}

export function id(text) {
    if (nodes[text]) return nodes[text].id;
    else if (Object.values(stations).find((s) => s.name === text))
        return Object.values(stations).find((s) => s.name === text).id;
    return text;
}
