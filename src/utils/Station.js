import nodes from '../data/nodes.json';
import stations from '../data/stations.json';

export function number_name(code) {
    const result = nodes[code]?.name;
    // const result = Object.values(stations).find(station => station.code.includes(code))?.name;
    return result ?? null;
}

export function name_number(text) {
    if (text === '中部国際空港') return ['HK28'];
    return stations[text]?.code ?? null;
}

export function name(text) {
    if (number_name(text) != null) {
        return number_name(text.slice(0, 4));
    } else {
        if (text == '空港') return '中部国際空港';
    }
    return text;
}

export function code(text) {
    if (name_number(text) != null) {
        return name_number(text);
    } else {
        if (text == '中部国際空港') return 'HK28';
    }
    return text;
}