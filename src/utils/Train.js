import { name } from "./Station";

export function terminal(train, diagram) {
    const station_list = diagram.railway.stations.map((sta) => name(sta.name));

    const terminalOperation = train.operations.find((op) => op.outerType === "A");
    let result = "";
    if (terminalOperation) {
        result = diagram.railway.stations[(train.direction === 0) ? terminalOperation.stationIndex : station_list.length - 1 - terminalOperation.stationIndex].outerTerminal[terminalOperation.terminalStationIndex].name
    } else {
        result = station_list[(train.direction === 0) ? train.timetable.terminalStationIndex : station_list.length - 1 - train.timetable.terminalStationIndex];
    }
    if (result === 'セントレア第2ターミナル') return '中部国際空港';
    return result;
}

export function typeName(train, diagram) {
    const result = diagram.railway.trainTypes[train.type].name;
    if (result === '普通 ') return '普通';
    if (result === 'たこつぼ') return '特急'
    return result;
}
