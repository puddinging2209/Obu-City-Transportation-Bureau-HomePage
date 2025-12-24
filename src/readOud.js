import lines from '/public/lines.json';
import { name_number, terminal, typeName } from './func.js';

async function dia(rosen) {
    if (lines[rosen]) {
        rosen = lines[rosen].json;
    }
    const response = await fetch(`/oud/${rosen}.json`);
    const diagram = await response.json();
    return diagram;
}

function indexOfStation(diagram, station, rosen, direction) {
    const exceptions = [
        { exc: { station: '大府', direction: { route: '大府環状線', stationName: '江端町' } }, return: 12 },
        { exc: { station: '日高', direction: { route: '刈谷環状線', stationName: '刈谷青山' } }, return: 17 },
        { exc: { station: '至学館大学前', direction: { route: '名東線', stationName: '藤が丘' } }, return: 0 },
    ];

    const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ station, direction }));
    if (exception) {
        return exception.return;
    }

    return diagram.railway.stations.findIndex((sta) => sta.name == name_number(station).find((value) => value.includes(rosen)));
}

async function searchDeparture(station, direction) {
    const json = lines[direction.route].json;
    const diagram = await dia(json);
    const rosen = lines[direction.route].code;
    const stationIndex = indexOfStation(diagram, station, rosen, direction);
    const codeofStation = name_number(direction.stationName.split('・')[0]).find((value) => value.includes(rosen))
    const numofStations = diagram.railway.stations.length;
    const d = (stationIndex < diagram.railway.stations.findIndex((sta) => sta.name == codeofStation)) ? 0 : 1;
    let departures = diagram.railway.diagrams[0].trains[d].filter((tra) =>
        tra.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.stopType === 1 &&
        tra.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.departure != null
    );
    if (direction.route === '刈田川急行線' && ['半月町', '大東町', '惣作'].includes(station)) {
        departures = departures.filter((tra) => tra.timetable._data[9]?.stopType === 1);
    } else if (direction.route === '刈田川線' && direction.stationName.includes('若草')) {
        departures = departures.filter((tra) => tra.timetable._data[9]?.stopType !== 1);
    }

    departures.sort((a, b) => {
        const timeA = a.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.departure;
        const timeB = b.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.departure;
        return timeA - timeB;
    });
    const result = departures.map((tra) => {
        const time = tra.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.departure;
        return {
            terminal: terminal(tra, diagram),
            typeName: typeName(tra, diagram),
            time,
            train: tra
        }
    })
    return result;
}
export { searchDeparture };