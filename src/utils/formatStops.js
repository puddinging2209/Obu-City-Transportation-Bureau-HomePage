import { dia, resolveRosen } from './readOud.js';
import { id, name } from './Station.js';
import { adjustTime } from './Time.js';

import lines from '../data/lines.json';
import nodes from '../data/nodes.json';
import numberList from '../data/numberList.json';
import stations from '../data/stations.json';

function searchStops(diagram, train) {
    const stationList = diagram.railway.stations.map((sta) => sta.name);
    console.log(diagram);
    if (!train) return [];
    return train.timetable._data
        .map((sta, i) => {
            const code = stationList[train.direction === 0 ? i : stationList.length - 1 - i];
            const stationId = id(code);
            const stationName = name(code);
            if (!sta || !code || !stationId || !stationName) return null;
            if (diagram.railway.name == 'KT' && stationId === 'chr') return null;
            if (diagram.railway.name == 'MR' && (stationId === 'okw' || stationId === 'hno'))
                return null;
            if (diagram.railway.name == 'NK' && (stationId === 'kyw' || stationId === 'tmo'))
                return null;
            if (sta.stopType === 1) {
                return {
                    name: stationName,
                    id: stationId,
                    code,
                    stopType: 'stop',
                    arr: sta.arrival ?? null,
                    dep: sta.departure ?? null,
                    lineName: nodes[code].line,
                };
            } else if (sta.stopType === 2) {
                return {
                    name: stationName,
                    id: stationId,
                    code,
                    stopType: 'pass',
                    arr: null,
                    dep: null,
                    lineName: nodes[code].line,
                };
            } else return null;
        })
        .filter((sta) => sta !== null);
}

async function searchOuter(train, first, last, line, baseDiagram, checked = [], depth = 0) {
    const result = {
        before: [],
        after: [],
    };
    if (depth > 10 || train.number == '') return result;
    if (first) {
        const diagrams = await Promise.all(
            stations[first].routes
                .filter(
                    (route) =>
                        numberList[resolveRosen(route)]?.includes(String(train.number)) &&
                        (resolveRosen(route) != resolveRosen(line) || lines[route].isLoop),
                )
                .map(dia),
        );
        const afterIndex =
            train.direction === 0 ?
                baseDiagram.railway.stations.findIndex((sta) => id(sta.name) === first)
            :   baseDiagram.railway.stations
                    .toReversed()
                    .findIndex((sta) => id(sta.name) === first);
        const beforeDiagram = diagrams.find((diagram) => {
            return diagram.railway.diagrams[0].trains.flat().some((d) => {
                const beforeIndex =
                    d.direction === 0 ?
                        diagram.railway.stations.findLastIndex((sta) => id(sta.name) === first)
                    :   diagram.railway.stations
                            .toReversed()
                            .findLastIndex((sta) => id(sta.name) === first);
                if (beforeIndex === -1) return false;
                return (
                    d.number == train.number &&
                    (!(
                        Object.values(lines).find(
                            (l) => l.json === resolveRosen(diagram.railway.name),
                        )?.isLoop ||
                        Object.values(lines).find((l) => l.json === resolveRosen(line))?.isLoop
                    ) ||
                        (d.timetable._data[beforeIndex].arrival ?
                            adjustTime(d.timetable._data[beforeIndex]?.arrival) <
                            adjustTime(train.timetable._data[afterIndex]?.departure)
                        :   adjustTime(d.timetable._data[beforeIndex]?.departure) <=
                            adjustTime(train.timetable._data[afterIndex]?.departure)))
                );
            });
        });
        if (beforeDiagram) {
            const before = beforeDiagram.railway.diagrams[0].trains.flat().find((d) => {
                const beforeIndex =
                    d.direction === 0 ?
                        beforeDiagram.railway.stations.findLastIndex(
                            (sta) => id(sta.name) === first,
                        )
                    :   beforeDiagram.railway.stations
                            .toReversed()
                            .findLastIndex((sta) => id(sta.name) === first);
                if (beforeIndex === -1) return undefined;
                return (
                    d.number == train.number &&
                    (!(
                        Object.values(lines).find(
                            (l) => l.json === resolveRosen(beforeDiagram.railway.name),
                        )?.isLoop ||
                        Object.values(lines).find((l) => l.json === resolveRosen(line))?.isLoop
                    ) ||
                        (d.timetable._data[beforeIndex].arrival ?
                            adjustTime(d.timetable._data[beforeIndex]?.arrival) <
                            adjustTime(train.timetable._data[afterIndex]?.departure)
                        :   adjustTime(d.timetable._data[beforeIndex]?.departure) <=
                            adjustTime(train.timetable._data[afterIndex]?.departure)))
                );
            });

            if (
                checked.some(
                    (c) =>
                        c.line === beforeDiagram.railway.name &&
                        c.firstStationIndex === before.timetable.firstStationIndex &&
                        c.terminalStationIndex === before.timetable.terminalStationIndex,
                )
            ) {
                return result;
            }

            const beforeStops = searchStops(beforeDiagram, before);
            const lastIndex = beforeStops.findIndex(
                (sta) => sta.id === first && beforeDiagram.railway.name !== 'OL',
            );
            result.before.unshift(
                ...beforeStops.slice(0, lastIndex !== -1 ? lastIndex + 1 : beforeStops.length),
            );
            if (
                before.operations.some((op) => op.outerType === 'B') ||
                (result.before[0].id === 'kry' && result.before[0].lineName === '刈田川線') ||
                (result.before[0].id === 'hns' && result.before[0].lineName === '師崎線') ||
                (result.before[0].id === 'tsn' && result.before[0].lineName === '内田面線')
            ) {
                const befores = await searchOuter(
                    before,
                    result.before[0].id,
                    null,
                    beforeDiagram.railway.name,
                    beforeDiagram,
                    [
                        ...checked,
                        {
                            line: beforeDiagram.railway.name,
                            firstStationIndex: before.timetable.firstStationIndex,
                            terminalStationIndex: before.timetable.terminalStationIndex,
                        },
                    ],
                    depth + 1,
                );
                result.before.unshift(...befores.before);
            }
        }
    }
    if (last) {
        const diagrams = await Promise.all(
            stations[last].routes
                .filter(
                    (route) =>
                        numberList[resolveRosen(route)]?.includes(String(train.number)) &&
                        (resolveRosen(route) != resolveRosen(line) || lines[route].isLoop),
                )
                .map(dia),
        );
        const beforeIndex =
            train.direction === 0 ?
                baseDiagram.railway.stations.findLastIndex((sta) => id(sta.name) === last)
            :   baseDiagram.railway.stations
                    .toReversed()
                    .findLastIndex((sta) => id(sta.name) === last);
        const afterDiagram = diagrams.find((diagram) => {
            return diagram.railway.diagrams[0].trains.flat().some((d) => {
                const afterIndex =
                    d.direction === 0 ?
                        diagram.railway.stations.findIndex((sta) => id(sta.name) === last)
                    :   diagram.railway.stations
                            .toReversed()
                            .findIndex((sta) => id(sta.name) === last);
                return (
                    d.number == train.number &&
                    (!(
                        Object.values(lines).find(
                            (l) => l.json === resolveRosen(diagram.railway.name),
                        )?.isLoop ||
                        Object.values(lines).find((l) => l.json === resolveRosen(line))?.isLoop
                    ) ||
                        (train.timetable._data[beforeIndex].arrival ?
                            adjustTime(d.timetable._data[afterIndex]?.departure) >
                            adjustTime(train.timetable._data[beforeIndex]?.arrival)
                        :   adjustTime(d.timetable._data[afterIndex]?.departure) >=
                            adjustTime(train.timetable._data[beforeIndex]?.departure)))
                );
            });
        });
        if (afterDiagram) {
            const after = afterDiagram.railway.diagrams[0].trains.flat().find((d) => {
                const afterIndex =
                    d.direction === 0 ?
                        afterDiagram.railway.stations.findIndex((sta) => id(sta.name) === last)
                    :   afterDiagram.railway.stations
                            .toReversed()
                            .findIndex((sta) => id(sta.name) === last);
                if (afterIndex === -1) return false;
                return (
                    d.number == train.number &&
                    (!(
                        Object.values(lines).find(
                            (l) => l.json === resolveRosen(afterDiagram.railway.name),
                        )?.isLoop ||
                        Object.values(lines).find((l) => l.json === resolveRosen(line))?.isLoop
                    ) ||
                        (train.timetable._data[beforeIndex].arrival ?
                            adjustTime(d.timetable._data[afterIndex]?.departure) >
                            adjustTime(train.timetable._data[beforeIndex]?.arrival)
                        :   adjustTime(d.timetable._data[afterIndex]?.departure) >=
                            adjustTime(train.timetable._data[beforeIndex]?.departure)))
                );
            });

            if (
                checked.some(
                    (c) =>
                        c.line === afterDiagram.railway.name &&
                        c.firstStationIndex === after.timetable.firstStationIndex &&
                        c.terminalStationIndex === after.timetable.terminalStationIndex,
                )
            ) {
                return result;
            }

            const afterStops = searchStops(afterDiagram, after);
            const firstIndex = afterStops.findIndex((sta) => sta.id === last);
            result.after.push(...afterStops.slice(firstIndex, afterStops.length));
            if (
                after.operations.some((op) => op.outerType === 'A') ||
                (result.after.at(-1).id === 'kry' && result.after.at(-1).lineName === '刈田川線') ||
                (result.after.at(-1).id === 'hns' && result.after.at(-1).lineName === '師崎線') ||
                (result.after.at(-1).id === 'tsn' && result.after.at(-1).lineName === '内田面線')
            ) {
                const afters = await searchOuter(
                    after,
                    null,
                    result.after.at(-1).id,
                    afterDiagram.railway.name,
                    afterDiagram,
                    [
                        ...checked,
                        {
                            line: afterDiagram.railway.name,
                            firstStationIndex: after.timetable.firstStationIndex,
                            terminalStationIndex: after.timetable.terminalStationIndex,
                        },
                    ],
                    depth + 1,
                );
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

    const before =
        train.operations.some((op) => op.outerType === 'B') ||
        (inner[0].id === 'kry' && inner[0].lineName === '刈田川線') ||
        (inner[0].id === 'hns' && inner[0].lineName === '師崎線') ||
        (inner[0].id === 'tsn' && inner[0].lineName === '内田面線');
    const after =
        train.operations.some((op) => op.outerType === 'A') ||
        (inner.at(-1).id === 'kry' && inner.at(-1).lineName === '刈田川線') ||
        (inner.at(-1).id === 'hns' && inner.at(-1).lineName === '師崎線') ||
        (inner.at(-1).id === 'tsn' && inner.at(-1).lineName === '内田面線');

    const outer = await searchOuter(
        train,
        before ? inner[0].id : null,
        after ? inner.at(-1).id : null,
        line,
        innerDiagram,
    );

    const preResult = [...outer.before, ...inner, ...outer.after];
    let result = [];
    for (let i = 0; i < preResult.length; i++) {
        if (i < preResult.length - 2 && preResult[i].id === preResult[i + 1].id) {
            result.push({
                name: preResult[i].name,
                id: preResult[i].id,
                code: preResult[i].code,
                stopType: preResult[i].stopType,
                arr: preResult[i].arr,
                dep: preResult[i + 1].dep,
                lineName: preResult[i].lineName,
            });
        } else if (i > 0 && preResult[i - 1].id === preResult[i].id) {
            continue;
        } else if (
            (preResult[i].id === 'obu' || preResult[i].id === 'ktk') &&
            preResult[i].stopType === 'pass'
        ) {
            continue;
        } else if (
            lines[preResult[i].lineName].code === 'KT' &&
            preResult.some((sta) => sta.id === 'obu' && sta.stopType === 'stop') &&
            ['obm', 'krn', 'wks'].includes(preResult[i].id) &&
            preResult[i].stopType === 'pass'
        ) {
            continue;
        } else result.push(preResult[i]);
    }

    return result;
}
