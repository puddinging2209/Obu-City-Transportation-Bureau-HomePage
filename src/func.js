import stations from '../public/data/stations.json';

function nowsecond() {
    const now = new Date();
    return adjustTime(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
}

function toTime(seconds) {
    if (seconds > 86400) seconds -= 86400;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return { h, m, s };
}

function toTimeString(seconds) {
    const timeObj = toTime(seconds);
    const hStr = String(timeObj.h);
    const mStr = String(timeObj.m).padStart(2, '0');
    return `${hStr}:${mStr}`;
}

function adjustTime(seconds) {
    return (seconds < 10800) ? seconds + 86400 : seconds;
}

function number_name(code) {
    const result = Object.values(stations).find(station => station.code.includes(code))?.name;
    return result ?? null;
}

function name_number(text) {
    if (text === '中部国際空港') return ['HK28'];
    return stations[text]?.code ?? null;
}

function name(text) {
    if (number_name(text.slice(0, 4)) !== null) {
        return number_name(text.slice(0, 4));
    } else {
        return text;
    }
}

function terminal(train, diagram) {
    const station_list = diagram.railway.stations.map((sta) => sta.name);
    let operation_types;
    let terminal_index;
    if (train.direction === 0) {
        operation_types = [];
        if (train.operations.length !== 0) {
            operation_types = train.operations.map((obj) => {
                return obj.outerType;
            })
        }
        terminal_index = operation_types.indexOf("A");
        return terminal_index === -1 ?
            station_list[Number(train.timetable.terminalStationIndex)] :
            diagram.railway.stations[train.timetable.terminalStationIndex].outerTerminal[train.operations[terminal_index].terminalStationIndex].name;
    } else {
        operation_types = [];
        if (train.operations.length !== 0) {
            operation_types = train.operations.map((obj) => {
                return obj.outerType;
            })
        }
        terminal_index = operation_types.indexOf("A");
        return terminal_index === -1 ?
            station_list[station_list.length - 1 - Number(train.timetable.terminalStationIndex)] :
            diagram.railway.stations[station_list.length - 1 - train.timetable.terminalStationIndex].outerTerminal[train.operations[terminal_index].terminalStationIndex].name;
    }
}

function typeName(train, diagram) {
    return diagram.railway.trainTypes[train.type].name;
}

export { adjustTime, name, name_number, nowsecond, terminal, toTime, toTimeString, typeName };
