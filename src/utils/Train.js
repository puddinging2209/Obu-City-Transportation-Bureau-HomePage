export function terminal(train, diagram) {
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

export function typeName(train, diagram) {
    return diagram.railway.trainTypes[train.type].name;
}
