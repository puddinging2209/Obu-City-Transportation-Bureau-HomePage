import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.resolve(__dirname, '../public/oud');

const OUT_DIR = path.resolve(__dirname, '../src/data');

export default async function listTrainNumbers(line) {
	const inputPath = path.join(INPUT_DIR, `${line}.json`);
	const diagram = JSON.parse(await fs.readFile(inputPath, 'utf-8'));

	const json = JSON.parse(await fs.readFile(path.join(OUT_DIR, 'numberList.json'), 'utf-8'));

	const trainNumberList = diagram.railway.diagrams[0].trains
		.flat()
		.map((t) => t.number)
		.filter((t) => t !== '')
		.sort();

	const result = {
		...json,
		[line]: trainNumberList,
	};

	const outputPath = path.join(OUT_DIR, 'numberList.json');
	await fs.writeFile(outputPath, JSON.stringify(result), 'utf-8');
}
