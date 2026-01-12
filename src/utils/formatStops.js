import { dia } from './readOud';

function seachStops(diagram, train) {
    const stationList = diagram.railway.stations.map((sta) => sta.name);
    return train.timetable._data.map((sta, i) => {
        const name = stationList[(train.direction === 0) ? i : stationList.length - 1 - i]
        if (!sta) return null;
        if (sta.stopType === 1) {
            return {
                name: name,
                stopType: 'stop',
                arr: sta.arrival ?? null,
                dep: sta.departure ?? null,
            }
        } else if (sta.stopType === 2) {
            return {
                name: name,
                stopType: 'pass',
                arr: null,
                dep: null,
            }
        } else {
            return null
        }
    }).filter(sta => sta !== null);
}

export default async function formatStops(line, train) {
    const innerDiagram = await dia(line);
    const inner = seachStops(innerDiagram, train);

    // 列車番号で同一列車を識別
    // 列車番号の入力がすむまで線内区間のみ
    return [...inner];
}