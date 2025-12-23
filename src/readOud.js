import fs from 'fs';

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

export { dia };