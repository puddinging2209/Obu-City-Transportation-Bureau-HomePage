import { dia, resolveRosen } from './readOud.js';
import { name } from './Station.js';
import { adjustTime, toTimeString } from './Time.js';

import lines from '../data/lines.json';
import nodes from '../data/nodes.json';
import numberList from '../data/numberList.json';
import stations from '../data/stations.json';
import { terminal, typeName } from './Train.js';

function getOtherDepartures(diagram, direction, index, from, to) {

    function getPassTime(train) {
        let passfrom = index;
        while (passfrom >= 0 && (!train.timetable._data[passfrom]?.departure || !train.timetable._data[passfrom]?.arrival)) {
            passfrom--;
        }
        let passto = index;
        while (passto < train.timetable._data.length && (!train.timetable._data[passto]?.departure || !train.timetable._data[passto]?.arrival)) {
            passto++;
        }
        const passLength = passto - passfrom;
        const fromTime = adjustTime(train.timetable._data[passfrom]?.departure ?? train.timetable._data[passfrom]?.arrival);
        const toTime = adjustTime(train.timetable._data[passto]?.departure ?? train.timetable._data[passto]?.arrival);
        const result = fromTime + (toTime - fromTime) * (index - passfrom) / passLength;
        console.log(toTimeString(result));
        return result;
    }

    if (!from || !to) return [];
    const result = diagram.railway.diagrams[0].trains[direction].filter(train => {
        if (!train.timetable._data[index]) return false;
        const dep = adjustTime(
            (train.timetable._data[index]?.departure) ?
                train.timetable._data[index]?.departure :
                getPassTime(train)
        );
        const arr = adjustTime(train.timetable._data[index]?.arrival);
        if (dep && from < dep && dep < to) {
            return true;
        }
        if (dep && arr && arr < from && to < dep) {
            return true;
        }
        return false;
    });
    return result.map(train => ({
        ...train,
        terminal: terminal(train, diagram),
        typeName: typeName(train, diagram),
    }))
}

function getStopList(diagram, train) {
    const stationList = diagram.railway.stations.map((sta) => sta.name);
    return train.timetable._data.map((sta, i) => {
        if (!sta) return null;
        const index = (train.direction === 0) ? i : stationList.length - 1 - i;
        const code = stationList[index];
        const otherDepartures = getOtherDepartures(diagram, train.direction, index, sta.arrival, sta.departure);
        if (otherDepartures.length > 0) {
            console.log(`Other departures at ${name(code)} :`, otherDepartures);
        }
        const stationName = name(code);
        if (diagram.railway.name == 'KT' && stationName === '知立') return null
        if (diagram.railway.name == 'MR' && (stationName === '乙川' || stationName === '半田大橋')) return null
        if (diagram.railway.name == 'NK' && (stationName === '共和' || stationName === '田面')) return null
        if (sta.stopType === 1) {
            return {
                name: stationName,
                code,
                stopType: 'stop',
                arr: sta.arrival ?? null,
                dep: sta.departure ?? null,
                lineName: nodes[code].line,
            }
        } else if (sta.stopType === 2) {
            return {
                name: stationName,
                code,
                stopType: 'pass',
                arr: null,
                dep: null,
                lineName: nodes[code].line,
            }
        } else return null
    }).filter(sta => sta !== null);
}

async function getOuterStopList(train, first, last, line) {
    const result = {
        before: [],
        after: []
    };
    if (first) {
        const diagrams = await Promise.all(
            stations[first].routes.filter(route =>
                numberList[resolveRosen(route)]?.includes(train.number) &&
                (
                    resolveRosen(route) != resolveRosen(line) ||
                    lines[route].isLoop
                )
            ).map(route => dia(route))
        );
        const beforeDiagram = diagrams.find(diagram => {
            return diagram.railway.diagrams[0].trains
                .flat()
                .some(d =>
                    d.number == train.number &&
                    d.number !== '' &&
                    (
                        !(
                            Object.values(lines).find(l => l.json === resolveRosen(diagram.railway.name))?.isLoop &&
                            Object.values(lines).find(l => l.json === resolveRosen(line))?.isLoop
                        ) ||
                        adjustTime(
                            d.timetable._data[d.timetable.terminalStationIndex]?.arrival ??
                            d.timetable._data[d.timetable.terminalStationIndex]?.departure
                        ) <= adjustTime(train.timetable._data[train.timetable.firstStationIndex]?.departure)
                    )
                );
        });
        if (beforeDiagram) {
            const before =
                beforeDiagram.railway.diagrams[0].trains
                    .flat()
                    .find(d =>
                        d.number == train.number &&
                        d.number !== '' &&
                        (
                            !(
                                Object.values(lines).find(l => l.json === resolveRosen(beforeDiagram.railway.name))?.isLoop &&
                                Object.values(lines).find(l => l.json === resolveRosen(line))?.isLoop
                            ) ||
                            adjustTime(
                                d.timetable._data[d.timetable.terminalStationIndex]?.arrival ??
                                d.timetable._data[d.timetable.terminalStationIndex]?.departure
                            ) <= adjustTime(train.timetable._data[train.timetable.firstStationIndex]?.departure)
                        )
                    );

            const beforeStops = getStopList(beforeDiagram, before);
            const lastIndex = beforeStops.findIndex(sta => sta.name === first && beforeDiagram.railway.name !== 'OL');
            result.before.unshift(...beforeStops.slice(0, lastIndex !== -1 ? lastIndex + 1 : beforeStops.length));
            if (
                before.operations.some(op => op.outerType === 'B') ||
                (result.before[0].name === '刈谷' && result.before[0].lineName === '刈田川線') ||
                (result.before[0].name === '半田市' && result.before[0].lineName === '師崎線') ||
                (result.before[0].name === '東新町' && result.before[0].lineName === '内田面線')
            ) {
                const befores = await getOuterStopList(before, result.before[0].name, null, beforeDiagram.railway.name);
                result.before.unshift(...befores.before);
            }
        }
    }
    if (last) {
        const diagrams = await Promise.all(
            stations[last].routes.filter(route =>
                numberList[resolveRosen(route)]?.includes(train.number) &&
                (
                    resolveRosen(route) != resolveRosen(line) ||
                    lines[route].isLoop
                )
            ).map(route => dia(route)));
        const afterDiagram = diagrams.find(diagram => {
            return diagram.railway.diagrams[0].trains
                .flat()
                .some(d =>
                    d.number == train.number &&
                    d.number !== '' &&
                    (
                        !(
                            Object.values(lines).find(l => l.json === resolveRosen(diagram.railway.name))?.isLoop &&
                            Object.values(lines).find(l => l.json === resolveRosen(line))?.isLoop
                        ) ||
                        adjustTime(d.timetable._data[d.timetable.firstStationIndex]?.departure) >=
                        adjustTime(
                            train.timetable._data[train.timetable.terminalStationIndex]?.arrival ??
                            train.timetable._data[train.timetable.terminalStationIndex]?.departure
                        )
                    )
                );
        });
        if (afterDiagram) {
            const after = afterDiagram.railway.diagrams[0].trains
                .flat()
                .find(d =>
                    d.number == train.number &&
                    d.number !== '' &&
                    (
                        !(
                            Object.values(lines).find(l => l.json === resolveRosen(afterDiagram.railway.name))?.isLoop &&
                            Object.values(lines).find(l => l.json === resolveRosen(line))?.isLoop
                        ) ||
                        adjustTime(d.timetable._data[d.timetable.firstStationIndex]?.departure) >=
                        adjustTime(
                            train.timetable._data[train.timetable.terminalStationIndex]?.arrival ??
                            train.timetable._data[train.timetable.terminalStationIndex]?.departure
                        )
                    )
                );

            const afterStops = getStopList(afterDiagram, after);
            const firstIndex = afterStops.findIndex(sta => sta.name === last);
            result.after.push(...afterStops.slice(firstIndex, afterStops.length));
            if (
                after.operations.some(op => op.outerType === 'A') ||
                (result.after.at(-1).name === '刈谷' && result.after.at(-1).lineName === '刈田川線') ||
                (result.after.at(-1).name === '半田市' && result.after.at(-1).lineName === '師崎線') ||
                (result.after.at(-1).name === '東新町' && result.after.at(-1).lineName === '内田面線')
            ) {
                const afters = await getOuterStopList(after, null, result.after.at(-1).name, afterDiagram.railway.name);
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
    const inner = getStopList(innerDiagram, train);

    const before = train.operations.some(op => op.outerType === 'B') ||
        (inner[0].name === '刈谷' && inner[0].lineName === '刈田川線') ||
        (inner[0].name === '半田市' && inner[0].lineName === '師崎線') ||
        (inner[0].name === '東新町' && inner[0].lineName === '内田面線');
    const after = train.operations.some(op => op.outerType === 'A') ||
        (inner.at(-1).name === '刈谷' && inner.at(-1).lineName === '刈田川線') ||
        (inner.at(-1).name === '半田市' && inner.at(-1).lineName === '師崎線') ||
        (inner.at(-1).name === '東新町' && inner.at(-1).lineName === '内田面線');

    const outer = await getOuterStopList(train, (before) ? inner[0].name : null, (after) ? inner.at(-1).name : null, line);

    const preResult = [...outer.before, ...inner, ...outer.after];
    let result = [];
    for (let i = 0; i < preResult.length; i++) {
        if (i < preResult.length - 2 && preResult[i].name === preResult[i + 1].name) {
            result.push({
                name: preResult[i].name,
                code: preResult[i].code,
                stopType: preResult[i].stopType,
                arr: preResult[i].arr,
                dep: preResult[i + 1].dep,
                lineName: preResult[i].lineName,
            });
        } else if (i > 0 && preResult[i - 1].name === preResult[i].name) {
            continue;
        } else if ((preResult[i].name === '大府' || preResult[i].name === '北加木屋') && preResult[i].stopType === 'pass') {
            continue;
        } else if (lines[preResult[i].lineName].code === 'KT' && preResult.some((sta) => sta.name === '大府' && sta.stopType === 'stop') && ['大府森岡', '鞍流瀬川', '若草'].includes(preResult[i].name) && preResult[i].stopType === 'pass') {
            continue;
        } else result.push(preResult[i]);
    }

    return result;
}