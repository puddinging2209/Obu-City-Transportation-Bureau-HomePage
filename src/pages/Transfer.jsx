import React from 'react';

import TransferInput from "../components/TransferInput.jsx";

import { dijkstra } from "../utils/findRoute.js";

function Transfer() {

    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    
    async function searchTransfer(from, to, time, mode, tokkyu) {
        if (!from || !to) return;
        const segments = await dijkstra(from, to, time, mode, tokkyu);
        console.log(segments);
    }

    return (
        <TransferInput onSearch={searchTransfer} />
    )
}

export default Transfer