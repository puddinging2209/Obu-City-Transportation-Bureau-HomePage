import React from 'react';

import ReactDOM from 'react-dom/client';
import ReactModal from 'react-modal';
import { registerSW } from 'virtual:pwa-register';

import './App.css';
import App from './App.jsx';

ReactModal.setAppElement('#root');
registerSW({ immediate: true });

// if ("serviceWorker" in navigator) {
//     window.addEventListener("load", () => {
//         navigator.serviceWorker.register("./sw.js", {
//             updateViaCache: "none",
//         });
//     });
// }

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)