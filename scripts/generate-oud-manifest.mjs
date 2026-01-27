import crypto from "crypto";
import fs from "fs";
import path from "path";

const OUD_DIR = "public/oud";
const MANIFEST_PATH = path.join(OUD_DIR, "manifest.json");

const files = fs.readdirSync(OUD_DIR).filter(f => f.endsWith(".json") && f !== "manifest.json");

const manifest = {
    generatedAt: new Date().toISOString(),
    files: {}
};

for (const file of files) {
    const filePath = path.join(OUD_DIR, file);
    const buffer = fs.readFileSync(filePath);

    const hash = crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex");

    manifest.files[file] = {
        hash,
        size: buffer.length
    };
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log("✅ manifest.json generated");

process.exit(0);