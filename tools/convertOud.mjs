#!/usr/bin/env node

/*
 * 使い方:
 *
 *   /tools/temp に .oud2 ファイルを置く
 *
 *   node tools/convertOud.mjs LINE [FILENAME]
 *
 */

import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { dia } from './diaNode.mjs';

import listTrainNumbers from './listTrainNumbers.mjs';

// ========= パス解決 =========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.resolve(__dirname, 'temp');
const OUT_DIR = path.resolve(__dirname, './temp');

// ========= CLI引数 =========
const line = process.argv[2];
const fileName = process.argv[3] ?? line;

if (!line) {
	console.error('❌ 路線名が指定されていません');
	console.error('   node tools/adjustOud.mjs line [FILENAME]');
	process.exit(1);
}

// ========= OUD2読み込み & パース =========
async function readOud2(fileName) {
	const inputPath = path.join(TEMP_DIR, `${fileName}.json`);
	const text = await readFile(inputPath, 'utf-8');

	const diagram = JSON.parse(text);

	return diagram;
}

// ========= 修正 =========
async function convertOud(line, diagram) {
	const oldDia = await dia(line);

	if (fileName === 'KT') {
		const newKTStations = oldDia.railway.stations.filter((s) => s.name !== 'KT00');
		newKTStations.find((s) => s.name === 'KT07').outerTerminal = [{ name: 'a' }];
		const newKTaStations = oldDia.railway.stations.filter(
			(s) => s.name === 'KT07' || s.name === 'KT00' || s.name === 'KT11' || s.name === 'KT12',
		);
		newKTaStations.find((s) => s.name === 'KT07').outerTerminal = [{ name: 'a' }];
		const newKTaStationIndexs = newKTaStations.map((s) => oldDia.railway.stations.findIndex((ss) => ss.name === s.name));
		const newKTTrains = [[], []];
		const newKTaTrains = [[], []];
		oldDia.railway.diagrams[0].trains.map((trains, i) => {
			const obuIndex =
				i === 0 ?
					oldDia.railway.stations.findIndex((s) => s.name === 'KT00')
				:	oldDia.railway.stations.length - 1 - oldDia.railway.stations.findIndex((s) => s.name === 'KT00');
			const KTnumberList = new Set();
			const KTaNumberList = new Set();
			trains.forEach((t) => {
				if (t.timetable._data[obuIndex]?.stopType !== 1) {
					newKTTrains[i].push({
						...t,
						timetable: {
							...t.timetable,
							_data: t.timetable._data.slice(0, obuIndex).concat(t.timetable._data.slice(obuIndex + 1)),
							terminalStationIndex:
								t.timetable.terminalStationIndex > obuIndex ? t.timetable.terminalStationIndex - 1 : t.timetable.terminalStationIndex,
						},
						operations: t.operations.map((op) => {
							return {
								...op,
								stationIndex: op.stationIndex > obuIndex ? op.stationIndex - 1 : op.stationIndex,
							};
						}),
					});
					KTnumberList.add(t.number);
				} else {
					const escapeIndex =
						i === 0 ?
							oldDia.railway.stations.findIndex((s) => s.name === 'KT07')
						:	oldDia.railway.stations.length - 1 - oldDia.railway.stations.findIndex((s) => s.name === 'KT12');
					const enterIndex =
						i === 0 ?
							oldDia.railway.stations.findIndex((s) => s.name === 'KT12')
						:	oldDia.railway.stations.length - 1 - oldDia.railway.stations.findIndex((s) => s.name === 'KT07');
					const hash = createHash('sha256').update(JSON.stringify(t)).digest('hex').slice(0, 8);
					const KTa = {
						...t,
						timetable: {
							...t.timetable,
							_data:
								t.direction === 0 ?
									newKTaStationIndexs.map((index) => t.timetable._data[index])
								:	newKTaStationIndexs
										.map((i) => oldDia.railway.stations.length - 1 - i)
										.toReversed()
										.map((index) => t.timetable._data[index]),
						},
						operations: [],
						hash,
					};
					KTa.timetable.firstStationIndex = KTa.timetable._data.findIndex((d) => d);
					KTa.timetable.terminalStationIndex = KTa.timetable._data.findLastIndex((d) => d);
					if (t.timetable.firstStationIndex < escapeIndex) {
						newKTTrains[i].push({
							...t,
							timetable: {
								...t.timetable,
								_data: t.timetable._data.slice(0, escapeIndex + 1),
								terminalStationIndex: escapeIndex,
							},
							operations: [
								...t.operations.filter((op) => op.outerType !== 'A'),
								{
									stationIndex: escapeIndex,
									outerType: 'A',
									value1: 4,
									terminalStationIndex: 0,
									time: null,
								},
							],
							hash,
						});
						KTa.operations.push({
							stationIndex: KTa.timetable.terminalStationIndex,
							outerType: 'A',
							value1: 4,
							terminalStationIndex: 0,
							time: null,
						});
						KTnumberList.add(t.number);
					}
					if (t.timetable.terminalStationIndex > enterIndex) {
						newKTTrains[i].push({
							...t,
							timetable: {
								...t.timetable,
								_data: new Array(enterIndex - 1).concat(t.timetable._data.slice(enterIndex)),
								firstStationIndex: enterIndex - 1,
								terminalStationIndex: t.timetable.terminalStationIndex - 1,
							},
							operations: [
								...t.operations.filter((op) => op.outerType !== 'B'),
								{
									stationIndex: enterIndex - 1,
									outerType: 'B',
									value1: 4,
									terminalStationIndex: 0,
									time: null,
								},
							],
							hash,
						});
						KTa.operations.push({
							stationIndex: KTa.timetable.firstStationIndex,
							outerType: 'B',
							value1: 4,
							terminalStationIndex: 0,
							time: null,
						});
						KTnumberList.add(t.number);
					}
					newKTaTrains[i].push(KTa);
					KTaNumberList.add(t.number);
				}
			});
		});
		return [
			{
				...oldDia,
				railway: {
					...oldDia.railway,
					stations: newKTStations,
					diagrams: [
						{
							...oldDia.railway.diagrams[0],
							trains: newKTTrains,
						},
					],
				},
			},
			{
				...oldDia,
				railway: {
					...oldDia.railway,
					stations: newKTaStations,
					diagrams: [
						{
							...oldDia.railway.diagrams[0],
							trains: newKTaTrains,
						},
					],
				},
			},
		];
	}
}

// ========= 出力 =========
async function writeOud(line, diagram) {
	await mkdir(OUT_DIR, { recursive: true });

	const outputPath = path.join(OUT_DIR, `${line}.json`);
	await writeFile(outputPath, JSON.stringify(diagram), 'utf-8');

	console.log(`出力完了: ${outputPath}`);
}

// ========= メイン =========
async function main() {
	try {
		console.log(`▶ 変換開始: ${fileName}.oud2 → ${line}.json`);

		const diagram = await readOud2(fileName);
		const newDiagrams = await convertOud(line, diagram);

		newDiagrams.forEach(async (d, i) => {
			await writeOud(line + i, d);
			await listTrainNumbers(line + i);
		});
	} catch (err) {
		console.error('❌ 変換失敗');
		console.error(err.message);
		process.exit(1);
	}
}

await main();
