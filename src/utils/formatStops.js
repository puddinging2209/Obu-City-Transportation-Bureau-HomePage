import { dia } from './readOud';
import { name } from './Station';

import lines from '../../public/data/lines.json';
import stations from '../../public/data/stations.json';

function nameOfLine(line) {
    if (lines[line]) return lines[line].name;
    return Object.values(lines).find(l => l.code === line).name;
}

async function outOfLineStation(line, train) {
    const diagram = await dia(line);
    const outerTerminals = diagram.railway.stations.map((sta) => sta.outerTerminal);

    let result = { from: null, to: null };

    train.operations.forEach(op => {
        result[op.outerType === 'A' ? 'to' : 'from'] = outerTerminals[(train.direction === 0) ? op.stationIndex : outerTerminals.length - 1 - op.stationIndex][op.terminalStationIndex].name;
    });

    return result;
}

async function seachStops(line, train) {
    const diagram = await dia(line);
    const stationList = diagram.railway.stations.map((sta) => sta.name);
    return train.timetable._data.map((sta, i) => {
        if (sta.stopType === 1) {
            return {
                name: stationList[(train.direction === 0) ? i : stationList.length - 1 - i],
                stopType: 'stop',
                arr: sta.arrival ?? null,
                dep: sta.departure ?? null,
            }
        } else if (sta.stopType === 2) {
            return {
                name: stationList[(train.direction === 0) ? i : stationList.length - 1 - i],
                stopType: 'pass',
                arr: null,
                dep: null,
            }
        } else {
            return null
        }
    }).filter(sta => sta !== null);
}

function beforeTrainStops(station, terminal, line, dep) {
    const directions = stations[name(station)].directions.filter(dir =>
        dir.route !== nameOfLine(line) &&
        lines[dir.route].stations.includes(name(terminal))
    );
    directions//directionsのそれぞれに対して同じ列車と思われる列車を探して、適合した列車と路線を返す→いい感じに再起関数にしたい
    // 今日は寝る
}

export default async function formatStops(line, train) {

    const base = await seachStops(line, train);
    const inner = {
        from: base[0].name,
        to: base.at(-1).name
    }
    const outer = await outOfLineStation(line, train);

    // 路線外始発駅のほう
    const beforeOperation = train.operations.find(op => op.outerType === 'B');
    if (beforeOperation) {
        beforeTrainStops(inner.from, outer.from, line, base[0].dep);
    }
}