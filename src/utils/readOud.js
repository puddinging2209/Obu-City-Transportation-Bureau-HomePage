import lines from '../data/lines.json';
import { name_number } from './Station.js';
import { adjustTime } from './Time.js';
import { terminal, typeName } from './Train.js';

function resolveRosen(rosen) {
    if (lines?.[rosen]) return lines[rosen].json;

    const found = Object.values(lines).find(l => l.code === rosen);
    if (found) return found.json;

    return rosen;
}

export async function dia(rosen) {

    async function searchOud(rosen) {
        try {
            const response = await fetch(`./oud/${rosen}.json`);
            const diagram = await response.json();
            return diagram;
        } catch (e) {
            const response = await fetch(`./public/oud/${rosen}.json`);
            const diagram = await response.json();
            return diagram;
        }
    }

    const diagram = await searchOud(resolveRosen(rosen));
    return diagram;
}

function indexofFromStation(diagram, station, rosen, direction) {
    const exceptions = [
        { exc: { station: '大府', direction: { route: '大府環状線', stationName: '江端町' } }, return: 12 },
        { exc: { station: '日高', direction: { route: '刈谷環状線', stationName: '刈谷青山' } }, return: 17 },
        { exc: { station: '至学館大学前', direction: { route: '名東線', stationName: '藤が丘' } }, return: 0 },
        { exc: { station: '大東町', direction: { route: '二ツ池線森岡支線', stationName: '於大公園西' } }, return: 8 },
        { exc: { station: '鳴海', direction: { route: '鳴海連絡線', stationName: '上汐田' } }, return: 1 },
        { exc: { station: '上汐田', direction: { route: '鳴海連絡線', stationName: '鳴海' } }, return: 0 },
        { exc: { station: '江端町', direction: { route: '大峯連絡線', stationName: '半田市' } }, return: 0 },
        { exc: { station: '乙川', direction: { route: '半田線', stationName: '大府' } }, return: 17 },
        { exc: { station: '乙川', direction: { route: '半田線住吉支線', stationName: '清城' } }, return: 17 },
    ];

    const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ station, direction }));
    if (exception) {
        return exception.return;
    }

    return diagram.railway.stations.findIndex((sta) => sta.name == name_number(station).find((value) => value.includes(rosen)));
}

function codeofToStation(station, direction, rosen) {
    const exceptions = [
        { exc: { station: '江端町', direction: { route: '大府環状線', stationName: '大府' } }, return: 'OL01a' },
        { exc: { station: '大峯', direction: { route: '大府環状線', stationName: '大府' } }, return: 'OL01a' },
        { exc: { station: '半田赤レンガ', direction: { route: '半田線住吉支線', stationName: '乙川' } }, return: 'HD17a' },
        { exc: { station: '住吉町', direction: { route: '半田線住吉支線', stationName: '乙川' } }, return: 'HD17a' },
        { exc: { station: '清城', direction: { route: '半田線住吉支線', stationName: '乙川' } }, return: 'HD17a' },
        { exc: { station: '上汐田', direction: { route: '鳴海連絡線', stationName: '鳴海' } }, return: 'GK04a' },
        { exc: { station: '鳴海', direction: { route: '鳴海連絡線', stationName: '上汐田' } }, return: 'OD14a' },
    ];

    const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ station, direction }));
    if (exception) {
        return exception.return;
    }

    return name_number(direction.stationName.split('・')[0]).find((value) => value.includes(rosen));
}

function fromStop(diagram, busStop, direction) {
    const exceptions = [
        { exc: { busStop: '大府駅東', direction: { route: '東コース', stationName: 'メディアス体育館おおぶ' } }, return: 2 },
        { exc: { busStop: '大府駅東', direction: { route: '東コース', stationName: '追分町六丁目' } }, return: 32 },
        { exc: { busStop: '共和駅西', direction: { route: '西コース', stationName: 'メディアス体育館おおぶ' } }, return: 33 },
        { exc: { busStop: '大府駅西', direction: { route: '南コース', stationName: '長寿医療研究センター' } }, return: 35 },
        { exc: { busStop: '共和駅東', direction: { route: '北コース', stationName: '口無大池' } }, return: 34 },
        { exc: { busStop: '大府市役所', direction: { route: '中央コース', stationName: 'おおぶ文化交流の杜' } }, return: 24 },
        { exc: { busStop: '大府市役所', direction: { route: 'サクラコース', stationName: 'げんきの郷' } }, return: 32 },
        { exc: { busStop: '大府駅東', direction: { route: 'ツツジコース', stationName: 'げんきの郷' } }, return: 34 },
    ];
    const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ busStop, direction }));
    if (exception) {
        return exception.return;
    }
    return diagram.railway.stations.findIndex((stop) => stop.name == busStop);
}

function toStop(diagram, busStop, direction) {
    return diagram.railway.stations.findIndex((stop) => stop.name == direction.stationName.split('・')[0]);
}

function busIndex(diagram, busStop, direction) {
    const exceptions = [
        { exc: { busStop: '大府駅東', direction: { route: '東コース', stationName: '長寿医療研究センター' } }, return: [{ from: 0, to: 1 }, { from: 2, to: 1 }] },
        { exc: { busStop: '長寿医療研究センター', direction: { route: '東コース', stationName: '大府駅東' } }, return: [{ from: 1, to: 0 }, { from: 1, to: 2 }] },
        { exc: { busStop: '大府駅東', direction: { route: '中央コース', stationName: '大府市役所' } }, return: [{ from: 0, to: 1 }, { from: 25, to: 24 }] },
        { exc: { busStop: '大府市役所', direction: { route: '中央コース', stationName: '大府駅東' } }, return: [{ from: 1, to: 0 }, { from: 24, to: 25 }] },
        { exc: { busStop: '大府市役所', direction: { route: 'サクラコース', stationName: '大府駅東' } }, return: [{ from: 1, to: 0 }, { from: 32, to: 33 }] },
        { exc: { busStop: '北崎町一丁目', direction: { route: '東コース', stationName: '名鉄前後駅' } }, return: [{ from: 15, to: 18 }, { from: 21, to: 18 }] },
        { exc: { busStop: '北崎町一丁目', direction: { route: '北コース', stationName: '名鉄前後駅' } }, return: [{ from: 14, to: 17 }, { from: 20, to: 17 }] },
        { exc: { busStop: '大府みどり公園', direction: { route: '東コース', stationName: '名鉄前後駅' } }, return: [{ from: 16, to: 18 }, { from: 20, to: 18 }] },
        { exc: { busStop: '大府みどり公園', direction: { route: '北コース', stationName: '名鉄前後駅' } }, return: [{ from: 15, to: 17 }, { from: 19, to: 17 }] },
        { exc: { busStop: '星城高校北', direction: { route: '東コース', stationName: '名鉄前後駅' } }, return: [{ from: 17, to: 18 }, { from: 29, to: 18 }] },
        { exc: { busStop: '星城高校北', direction: { route: '北コース', stationName: '名鉄前後駅' } }, return: [{ from: 16, to: 17 }, { from: 18, to: 17 }] },
        { exc: { busStop: '星城高校東', direction: { route: '東コース', stationName: '追分町六丁目' } }, return: [{ from: 19, to: 29 }] },
        { exc: { busStop: '星城高校東', direction: { route: '東コース', stationName: 'メディアス体育館おおぶ' } }, return: [{ from: 17, to: 7 }] },
        { exc: { busStop: '星城高校東', direction: { route: '北コース', stationName: '口無大池' } }, return: [{ from: 18, to: 26 }] },
        { exc: { busStop: '星城高校東', direction: { route: '北コース', stationName: '二ツ池セレトナ' } }, return: [{ from: 16, to: 13 }] },
    ];
    const exception = exceptions.find((exc) => JSON.stringify(exc.exc) == JSON.stringify({ busStop, direction }));
    if (exception) {
        return exception.return;
    }

    let from = [fromStop(diagram, busStop, direction)];
    let to = [toStop(diagram, busStop, direction)];
    return from.map((_, i) => ({ from: from[i], to: to[i] }));
}

async function searchDeparture(sta, direction) {

    if (sta.role === 'station') {
        const station = sta.name;
        const json = lines[direction.route].json;
        const diagram = await dia(json);
        const rosen = lines[direction.route].code;
        const stationIndex = indexofFromStation(diagram, station, rosen, direction);
        const toCode = codeofToStation(station, direction, rosen);
        const numofStations = diagram.railway.stations.length;
        const d = (stationIndex < diagram.railway.stations.findIndex((sta) => sta.name == toCode)) ? 0 : 1;
        let departures = diagram.railway.diagrams[0].trains[d].filter((tra) =>
            tra.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.stopType === 1 &&
            tra.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.departure != null
        );
        if (direction.route === '刈田川急行線' && ['半月町', '大東町', '惣作'].includes(station)) {
            departures = departures.filter((tra) => tra.timetable._data[9]?.stopType === 1);
        } else if (direction.route === '刈田川線' && direction.stationName.includes('若草')) {
            departures = departures.filter((tra) => tra.timetable._data[9]?.stopType !== 1);
        }
        return departures.map((tra) => {
            const time = tra.timetable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.departure;
            return {
                terminal: terminal(tra, diagram),
                typeName: typeName(tra, diagram),
                time: adjustTime(time),
                train: tra
            }
        }).sort((a, b) => adjustTime(a.time) - adjustTime(b.time));
    } else if (sta.role === 'busStop') {
        const busStop = sta.name;
        let routes = direction.route.split('/');
        const directions = routes.map((route) => {
            return { route: route, stationName: direction.stationName }
        });
        let departures = await Promise.all(routes.map(async (route, i) => {
            const diagram = await dia(route);
            const index = busIndex(
                diagram,
                busStop,
                { ...directions[i], stationName: directions[i].stationName.split('・')[(busStop === '大府駅東' && route === 'サクラコース') ? 1 : 0] }
            );
            return index.map((index) => {
                const d = (index.from < index.to) ? 0 : 1;
                const numofStations = diagram.railway.stations.length;
                const filtered = diagram.railway.diagrams[0].trains[d].filter((bus) =>
                    bus.timetable._data[(d === 0) ? index.from : numofStations - 1 - index.from]?.stopType === 1 &&
                    bus.timetable._data[(d === 0) ? index.from : numofStations - 1 - index.from]?.departure != null
                );
                return filtered.map((tra) => {
                    const time = tra.timetable._data[(d === 0) ? index.from : numofStations - 1 - index.from]?.departure;
                    return {
                        terminal: (d === 0) ? '左まわり' : '右まわり',
                        typeName: typeName(tra, diagram),
                        time: adjustTime(time),
                        train: tra
                    }
                });
            }).flat();
        }));

        return departures.flat().sort((a, b) => a.time - b.time);
    }
}
export { searchDeparture };

