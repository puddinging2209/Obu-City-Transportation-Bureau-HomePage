import React from 'react';

import ReactDOM from 'react-dom/client';
import ReactModal from 'react-modal';

import App from './App.jsx';

ReactModal.setAppElement('#root');

// Service Worker登録
let swRegistration = null;

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js", {
            updateViaCache: "none",
        }).then(reg => {
            swRegistration = reg;
            // manifest.jsonの更新を監視するロジックを開始
            monitorManifestUpdates();
        });
    });
}

/* manifest.jsonの更新を監視 */
let lastManifestVersion = null;

async function monitorManifestUpdates() {
    // 最初のバージョンを取得
    try {
        const response = await fetch("./oud/manifest.json", { cache: "no-store" });
        const manifest = await response.json();
        lastManifestVersion = JSON.stringify(manifest);
    } catch (err) {
        console.error("[Main] Failed to fetch initial manifest:", err);
    }

    // 10秒ごとにmanifest.jsonの更新をチェック
    setInterval(async () => {
        try {
            const response = await fetch("./oud/manifest.json", { cache: "no-store" });
            const manifest = await response.json();
            const currentVersion = JSON.stringify(manifest);

            // バージョンが変わった場合はキャッシュをクリア
            if (lastManifestVersion !== null && lastManifestVersion !== currentVersion) {
                console.log("[Main] Manifest changed - clearing cache");
                lastManifestVersion = currentVersion;
                await clearCache();
            }
        } catch (err) {
            console.error("[Main] Failed to check manifest:", err);
        }
    }, 10000); // 10秒ごと
}

/* Service Workerのキャッシュをクリア */
async function clearCache() {
    if (swRegistration && swRegistration.controller) {
        return new Promise((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = () => {
                console.log("[Main] Cache cleared successfully");
                // ページをリロード
                window.location.reload();
                resolve();
            };
            swRegistration.controller.postMessage(
                { type: "CLEAR_CACHE" },
                [channel.port2]
            );
        });
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)