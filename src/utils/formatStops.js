import { dia, resolveRosen } from './readOud';
import { name } from './Station';

import nodes from '../data/nodes.json';
import stations from '../data/stations.json';

function searchStops(diagram, train) {
    const stationList = diagram.railway.stations.map((sta) => sta.name);
    return train.timetable._data.map((sta, i) => {
        const code = stationList[(train.direction === 0) ? i : stationList.length - 1 - i];
        const stationName = name(code);
        if (!sta) return null;
        if (diagram.railway.name == 'KT' && stationName === '知立') return null
        if (sta.stopType === 1) {
            return {
                name: stationName,
                stopType: 'stop',
                arr: sta.arrival ?? null,
                dep: sta.departure ?? null,
                lineName: nodes[code].line,
            }
        } else if (sta.stopType === 2) {
            return {
                name: stationName,
                stopType: 'pass',
                arr: null,
                dep: null,
                lineName: nodes[code].line,
            }
        } else return null
    }).filter(sta => sta !== null);
}

async function searchOuter(train, first, last, line) {
    const result = {
        before: [],
        after: []
    };
    if (first) {
        const diagrams = await Promise.all(stations[first].routes.filter(route => resolveRosen(route) != resolveRosen(line)).map(route => dia(route)));
        const beforeDiagram = diagrams.find(diagram => {
            return diagram.railway.diagrams[0].trains.flat().some(d => d.number == train.number && d.number !== '');
        });
        if (beforeDiagram) {
            const before = beforeDiagram.railway.diagrams[0].trains.flat().find(d => d.number == train.number && d.number !== '');

            const beforeStops = searchStops(beforeDiagram, before);
            const lastIndex = beforeStops.findIndex(sta => sta.name === first);
            result.before.unshift(...beforeStops.slice(0, lastIndex + 1));
            if (before.operations.some(op => op.outerType === 'B')) {
                const befores = await searchOuter(before, result.before[0].name, null, beforeDiagram.railway.name);
                result.before.unshift(...befores.before);
            }
        }
    }
    if (last) {
        const diagrams = await Promise.all(stations[last].routes.filter(route => resolveRosen(route) != resolveRosen(line)).map(route => dia(route)));
        const afterDiagram = diagrams.find(diagram => {
            return diagram.railway.diagrams[0].trains.flat().some(d => d.number == train.number && d.number !== '');
        });
        if (afterDiagram) {
            const after = afterDiagram.railway.diagrams[0].trains.flat().find(d => d.number == train.number && d.number !== '');

            const afterStops = searchStops(afterDiagram, after);
            const firstIndex = afterStops.findIndex(sta => sta.name === last);
            result.after.push(...afterStops.slice(firstIndex, afterStops.length));
            if (after.operations.some(op => op.outerType === 'A')) {
                const afters = await searchOuter(after, null, result.after.at(-1).name, afterDiagram.railway.name);
                result.after.push(...afters.after);
            }
        }
    }
    return result;
}

/** 路線外を含めた停車駅リストを返す
 * @param {string} line 路線のコード
 * @param {object} train 列車オブジェクト
 * @returns {Promise<Array<{name: string, stopType: string, arr: string|null, dep: string|null}>>} 停車駅ごとの情報の配列
 */

export default async function formatStops(line, train) {
    const innerDiagram = await dia(line);
    const inner = searchStops(innerDiagram, train);

    const before = train.operations.some(op => op.outerType === 'B');
    const after = train.operations.some(op => op.outerType === 'A');

    const outer = await searchOuter(train, (before) ? inner[0].name : null, (after) ? inner.at(-1).name : null, line);

    const preResult = [...outer.before, ...inner, ...outer.after];
    let result = [];
    for (let i = 0; i < preResult.length; i++) {
        if (i < preResult.length - 2 && preResult[i].name === preResult[i + 1].name) {
            result.push({
                name: preResult[i].name,
                stopType: preResult[i].stopType,
                arr: preResult[i].arr,
                dep: preResult[i + 1].dep,
                lineName: preResult[i].lineName,
            });
        } else if (i > 0 && preResult[i - 1].name === preResult[i].name) {
            continue;
        } else if (preResult[i].name === '大府' && preResult[i].stopType === 'pass') {
            continue;
        } else if (resolveRosen(line) === 'KT' && preResult.some((sta) => sta.name === '大府' && sta.stopType === 'stop') && ['大府森岡', '鞍流瀬川', '若草'].includes(preResult[i].name) && preResult[i].stopType === 'pass') {
            continue;
        } else result.push(preResult[i]);
    }

    return result;
}