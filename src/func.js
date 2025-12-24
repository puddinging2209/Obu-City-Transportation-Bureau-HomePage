import fs from 'fs';

const stations = JSON.parse(fs.readFileSync('/public/stations.json', 'utf-8'));
const lines = JSON.parse(fs.readFileSync('/public/lines.json', 'utf-8'));

function toTime(seconds) {
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

function name_number(text) {
    return stations[text]?.code ?? null;
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

export { toTime, toTimeString, name_number, terminal, typeName };