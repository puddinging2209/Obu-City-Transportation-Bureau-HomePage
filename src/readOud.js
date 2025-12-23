import fs from 'fs';

function dia(rosen) {
    const diagram = JSON.parse(fs.readFileSync(`ouds\\${rosen}.json`, 'utf-8'));
    return diagram;
}

export { dia };