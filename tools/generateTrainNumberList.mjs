import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const line = process.argv[2];
const fileName = process.argv[3] || line;

const TEMP_DIR = path.resolve(__dirname, 'temp');
const OUT_DIR = path.resolve(__dirname, './temp');

const inputPath = path.join(TEMP_DIR, `${fileName}.json`);
const diagram = JSON.parse(await fs.readFile(inputPath, 'utf-8'));

const trainNumberList = diagram.railway.diagrams[0].trains.flat().map(t => t.number).filter(t => t !== '').sort();

const outputPath = path.join(OUT_DIR, `numberList_${line}.json`);
await fs.writeFile(
    outputPath,
    JSON.stringify(trainNumberList, null, 2),
    'utf-8'
);