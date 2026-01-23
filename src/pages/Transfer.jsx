import React from 'react';

import TransferInput from "../components/TransferInput.jsx";
import TransferOutput from "../components/TransferOutput.jsx";

import { dijkstra } from "../utils/findRoute.js";
import { adjustTime } from '../utils/Time.js';

function Transfer() {

    const [result, setResult] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    
    async function searchTransfer(from, to, time, mode, tokkyu) {
        if (!from || !to) return;
        setLoading(true)
        const segments = await dijkstra(from, to, adjustTime(time), mode, tokkyu)
        setResult((mode === 0) ? segments: segments?.reverse() ?? []);
        setLoading(false)
        console.log(segments)
    }

    return (
        <>
            <TransferInput loading={loading} onSearch={searchTransfer} />
            <TransferOutput segments={result} />
        </>
    )
}

export default Transfer