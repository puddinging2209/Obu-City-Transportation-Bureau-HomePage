import lines from '../data/lines.json';
import stations from '../data/stations.json';

import { dia } from './readOud';
import { name } from './Station';

function searchStops(diagram, train) {
    const stationList = diagram.railway.stations.map((sta) => sta.name);
    return train.timetable._data.map((sta, i) => {
        const stationName = name(stationList[(train.direction === 0) ? i : stationList.length - 1 - i])
        if (!sta) return null;
        if (sta.stopType === 1) {
            return {
                name: stationName,
                stopType: 'stop',
                arr: sta.arrival ?? null,
                dep: sta.departure ?? null,
            }
        } else if (sta.stopType === 2) {
            return {
                name: stationName,
                stopType: 'pass',
                arr: null,
                dep: null,
            }
        } else {
            return null
        }
    }).filter(sta => sta !== null);
}

async function searchOuter(train, first, last, line) {
    const result = {
        before: [],
        after: []
    };
    if (first) {
        const diagrams = await Promise.all(stations[first].routes.filter(route => lines[route].json != lines[line].json).map(route => dia(route)));
        const beforeDiagram = diagrams.find(diagram => {
            return diagram.railway.diagrams[0].trains.flat().some(d => d.number == train.number);
        });
        if (beforeDiagram) {
            const before = beforeLine.railway.diagrams[0].trains.flat().find(d => d.number == train.number);
            result.before.unshift(...searchStops(beforeDiagram, before));
            if (before.operations.some(op => op.outerType === 'B')) {
                result.before.unshift(...searchOuter(before, result.before[0], null, beforeLine.railway.name));
            }
        }
    }
    return result;
}

export default async function formatStops(line, train) {
    const innerDiagram = await dia(line);
    const inner = searchStops(innerDiagram, train);

    const before = train.operations.some(op => op.outerType === 'B');
    const after = train.operations.some(op => op.outerType === 'A');

    const outer = searchOuter(train, (before) ? inner[0].name : null, (after) ? inner.at(-1).name : null, line);

    // 列車番号で同一列車を識別
    const preResult = [...outer.before, ...inner, ...outer.after];
    let result = [];
    for (let i = 0; i < preResult.length; i++) {
        if (i < preResult.length - 2 && preResult[i].name === preResult[i + 1].name) {
            result.push({
                name: name(preResult[i].name),
                stopType: preResult[i].stopType,
                arr: preResult[i].arr,
                dep: preResult[i + 1].dep
            });
        } else if (i > 0 && preResult[i - 1].name === preResult[i].name) {
            continue;
        } else result.push(preResult[i]);
    }
    return result;
}