import React from 'react';

import ReactDOM from 'react-dom/client';
import ReactModal from 'react-modal';

import App from './App.jsx';

ReactModal.setAppElement('#root');

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)