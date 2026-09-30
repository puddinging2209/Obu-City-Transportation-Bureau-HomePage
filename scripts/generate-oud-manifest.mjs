import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const OUD_DIR = 'public/oud';
const MANIFEST_PATH = path.join(OUD_DIR, 'manifest.json');
const previousManifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) : null;

const files = fs.readdirSync(OUD_DIR).filter((f) => f.endsWith('.json') && f !== 'manifest.json');

const manifestFiles = {};

for (const file of files) {
	const filePath = path.join(OUD_DIR, file);
	const buffer = fs.readFileSync(filePath);

	const hash = crypto.createHash('sha256').update(buffer).digest('hex');

	// 拡張子を取り除いた '路線コード' をキーにする
	const code = path.basename(file, '.json');

	manifestFiles[code] = {
		hash,
		size: buffer.length,
	};
}

const previousFiles = previousManifest?.files ?? {};
const filesUnchanged =
	Object.keys(manifestFiles).length === Object.keys(previousFiles).length &&
	Object.entries(manifestFiles).every(([code, file]) => previousFiles[code]?.hash === file.hash && previousFiles[code]?.size === file.size);

const manifest = {
	generatedAt: filesUnchanged ? previousManifest.generatedAt : new Date().toISOString(),
	files: manifestFiles,
};

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log('✅ manifest.json generated successfully');

process.exit(0);
