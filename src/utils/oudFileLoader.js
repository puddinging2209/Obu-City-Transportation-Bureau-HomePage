const MANIFEST_KEY = "oud-manifest";
let oudManifest = null;

const BASE = import.meta.env.BASE_URL;

/** manifest を一度だけ読み込む
 * @return {Promise<Object|false>} manifestオブジェクト、またはdev環境ではfalse
 */
async function loadManifest() {
    if (oudManifest !== null) return oudManifest;

    try {
        const res = await fetch(`${BASE}oud/manifest.json`, {
            cache: "no-cache",
        });
        if (!res.ok) throw new Error();
        oudManifest = await res.json();
    } catch {
        oudManifest = false; // dev環境
    }

    return oudManifest;
}

/** ダイヤグラムを取得
 * @param {string} code 路線コード
 * @return {Promise<Object>} ダイヤグラムオブジェクト
 */
export async function fetchOud(code) {
    const manifest = await loadManifest();

    if (manifest && manifest.files?.[code]) {
        const hash = manifest.files[code].hash;
        const res = await fetch(`${BASE}oud/${code}.json?h=${hash}`);
        return await res.json();
    }

    // dev fallback
    const res = await fetch(`${BASE}oud/${code}.json`);
    return await res.json();
}
