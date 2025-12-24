import fs from 'fs';

import { name_number, terminal, typeName } from './func.js';

const correspondingRoute = {
    二ツ池線: 'FT',
    外環線: 'GK',
    鳴海連絡線: 'GK',
    半田線: 'HD',
    半田線住吉支線: 'HD',
    大峯連絡線: 'HD',
    高浜線: 'HD',
    半滑線・空港線: 'HK',
    刈谷環状線: 'KL',
    健康の森線: 'KM',
    刈田川線: 'KT',
    刈田川急行線: 'KT',
    刈田川線知立支線: 'KTa',
    師崎線: 'MR',
    内海線: 'MR',
    名東線: 'MT',
    みよし線: 'MY',
    南北線: 'NB',
    長久手線: 'NK',
    内田面線: 'UD',
    名和線: 'NW',
    大高線: 'OD',
    緒川線: 'OG',
    大府環状線: 'OL',
    大府西線: 'ON',
    '南港線(名港トリトンライン)': 'TR',
    つつじが丘線: 'TT',
    与五八デルタ線: 'TT',
    豊田線: 'TY',
    東西線: 'TZ',
    惣作直通線: 'TZ',
}

function dia(rosen) {
    if (correspondingRoute[rosen]) {
        rosen = correspondingRoute[rosen];
    }
    const diagram = JSON.parse(fs.readFileSync(`ouds\\${rosen}.json`, 'utf-8'));
    return diagram;
}

function searchDeparture(station, direction) {
    const rosen = correspondingRoute[direction.routeCode];
    const diagram = dia(rosen);
    const stationIndex = diagram.railway.stations.findIndex((sta) => sta.name == name_number(station));
    const numofStations = diagram.railway.stations.length;
    const d = (stationIndex < diagram.railway.stations.findIndex((sta) => sta.name == name_number(direction.stationName))) ? 0 : 1;
    const departures = diagram.railway.diagrams[d].trains.filter((tra) => tra.timeTable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.stopType === 1);
    departures.sort((a, b) => {
        const timeA = a.timeTable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.time;
        const timeB = b.timeTable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.time;
        return timeA - timeB;
    });
    const result = departures.map((tra) => {
        const time = tra.timeTable._data[(d === 0) ? stationIndex : numofStations - 1 - stationIndex]?.time;
        const terminal = terminal(tra, diagram);
        const typeName = typeName(tra, diagram);
        return {
            terminal,
            typeName,
            time,
            train: tra
        }
    })
    return departures;
}
export { searchDeparture };