#!/usr/bin/env node

/**
 * 使い方:
 * 
 *   /tools/temp に .oud2 ファイルを置く
 * 
 *   node tools/adjustOud.mjs LINE [FILENAME]
 *
 * 例:
 *   node tools/adjustOud.mjs HD
 *   node tools/adjustOud.mjs HD test
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { dia } from './diaNode.mjs';
import DiagramParser from './Parsers/DiagramParser.mjs';

// ========= パス解決（ESMの王道） =========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.resolve(__dirname, 'temp');
// const OUT_DIR = path.resolve(__dirname, '../public/oud');
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
    const inputPath = path.join(TEMP_DIR, `${fileName}.oud2`);
    const text = await readFile(inputPath, 'utf-8');

    const parser = new DiagramParser();
    const diagram = await parser.parse(text);

    return diagram;
}

// ========= 駅名修正 =========
async function adjustStationNames(line, diagram) {
    const oldDia = await dia(line);
    const newNames = oldDia.railway.stations.map(s => s.name);

    const newDiagram = {};
    newNames.forEach((name, i) => {
        const old = diagram.railway.stations[i].name;
        newDiagram.railway.stations[i].name = name;
        console.log(old, '>', name);
    });

    newDiagram.railway.name = line;

    return newDiagram;
}

// ========= 出力 =========
async function writeOud(line, diagram) {
    await mkdir(OUT_DIR, { recursive: true });

    const outputPath = path.join(OUT_DIR, `${line}.json`);
    await writeFile(
        outputPath,
        JSON.stringify(diagram),
        'utf-8'
    );

    console.log(`出力完了: ${outputPath}`);
}

// ========= メイン =========
async function main() {
    try {
        console.log(`▶ 変換開始: ${fileName}.oud2 → ${line}.json`);

        const diagram = await readOud2(fileName);
        const newDiagram = await adjustStationNames(line, diagram);

        await writeOud(line, newDiagram);
    } catch (err) {
        console.error('❌ 変換失敗');
        console.error(err.message);
        process.exit(1);
    }
}

await main();
