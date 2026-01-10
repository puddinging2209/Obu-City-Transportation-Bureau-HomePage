import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** lines.json を読む */
async function loadLines() {
    const json = await fs.readFile(
        path.join(__dirname, '..', 'public', 'data', 'lines.json'),
        'utf-8'
    );
    return JSON.parse(json);
}

/** rosenコードを解決 */
function resolveRosen(rosen, lines) {
    if (lines[rosen]) return lines[rosen].json;

    const found = Object.values(lines).find(l => l.code === rosen);
    if (found) return found.json;

    return rosen;
}

/** Node専用 dia */
export async function dia(rosen) {
    const lines = await loadLines();
    const resolved = resolveRosen(rosen, lines);

    const oudPath = path.join(__dirname, '..', 'public', 'oud', `${resolved}.json`);

    const json = await fs.readFile(oudPath, 'utf-8');
    return JSON.parse(json);
}
