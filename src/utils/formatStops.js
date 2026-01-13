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

export default async function formatStops(line, train) {
    const innerDiagram = await dia(line);
    const inner = searchStops(innerDiagram, train);

    // 列車番号で同一列車を識別
    // 列車番号の入力がすむまで線内区間のみ
    const preResult = [...inner];
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