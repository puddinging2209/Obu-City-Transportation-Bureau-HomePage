import React from 'react';

import ReactDOM from 'react-dom/client';
import ReactModal from 'react-modal';

import App from './App.jsx';

ReactModal.setAppElement('#root');

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register(
            import.meta.env.BASE_URL + "sw.js",
            {
                scope: import.meta.env.BASE_URL,
                updateViaCache: "none",
            }
        ).then(reg => {
            console.log("SW registered:", reg);
            reg.update();
        }).catch(err => {
            console.error("SW registration failed:", err);
        });
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);