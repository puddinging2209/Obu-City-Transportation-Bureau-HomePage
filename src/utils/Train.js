import { name } from "./Station";

export function terminal(train, diagram) {
    const station_list = diagram.railway.stations.map((sta) => name(sta.name));

    const terminalOperation = train.operations.find((op) => op.outerType === "A");
    if (terminalOperation) {
        return diagram.railway.stations[(train.direction === 0) ? terminalOperation.stationIndex : station_list.length - 1 - terminalOperation.stationIndex].outerTerminal[terminalOperation.terminalStationIndex].name
    } else {
        return station_list[(train.direction === 0) ? train.timetable.terminalStationIndex : station_list.length - 1 - train.timetable.terminalStationIndex];
    }
}

export function typeName(train, diagram) {
    return diagram.railway.trainTypes[train.type].name;
}
