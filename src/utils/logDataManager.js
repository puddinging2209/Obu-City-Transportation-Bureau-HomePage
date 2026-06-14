import CryptoJS from 'crypto-js';

// 環境変数（.env）にソルトを隠すとより安全ですが、今回は簡易的な固定値として定義
const SECRET_SALT = 'fT3*3$qC%1A9$LRt!wxmRPlfU&t';

/**
 * セーブデータをエクスポートする関数
 * @param {object} gameState - ゲームデータ
 * @param {string} filename - ダウンロードするファイル名
 * @default filename = 'station_log.obu'
 * @returns {void}
 */
export function exportSaveData(gameState, filename = 'station_log.obu') {
    const data = JSON.stringify(gameState);

    const hash = CryptoJS.SHA256(data + SECRET_SALT).toString();
    const rawPackage = JSON.stringify({ data, hash });

    const base64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(rawPackage));

    const blob = new Blob([base64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * セーブデータをインポートする関数
 * @param {string} fileText - 読み込むファイルのテキスト
 * @returns {object|null} 正常に読み込めたデータ、またはnull（エラー時）
 */
export function importSaveData(fileText) {
    try {
        const decodedStr = CryptoJS.enc.Base64.parse(fileText).toString(CryptoJS.enc.Utf8);
        const { data, hash } = JSON.parse(decodedStr);

        const expectedHash = CryptoJS.SHA256(data + SECRET_SALT).toString();
        if (hash !== expectedHash) {
            alert('セーブデータが破損しています');
            return null;
        }

        return JSON.parse(data);
    } catch {
        alert('不正なファイル形式です');
        return null;
    }
}
