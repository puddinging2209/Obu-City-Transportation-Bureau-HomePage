import stations from '../../public/data/stations.json';

export function number_name(code) {
    const result = Object.values(stations).find(station => station.code.includes(code))?.name;
    return result ?? null;
}

export function name_number(text) {
    if (text === '中部国際空港') return ['HK28'];
    return stations[text]?.code ?? null;
}

export function name(text) {
    if (number_name(text?.slice(0, 4)) != null) {
        return number_name(text.slice(0, 4));
    } else {
        if (text == '空港') return '中部国際空港';
    }
    return text;
}