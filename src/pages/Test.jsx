import React from "react";

import { Button } from "@mui/material";

import StationSelecter from "../components/StationSelecter.jsx";

import { dijkstra } from "../utils/findRoute.js";

import { code } from "../utils/Station.js";

export default function Test() {

    const [from, setFrom] = React.useState(null);
    const [to, setTo] = React.useState(null);

    async function searchTransfer() {
        if (!from || !to) return;
        const segments = await dijkstra(code(from)[0], code(to)[0], 50000, 0, false);
        console.log(segments);
    }

    return (
        <>
            <StationSelecter busStop={false} onChange={(value) => setFrom(value.value)} />
            <StationSelecter busStop={false} onChange={(value) => setTo(value.value)} />
            <Button onClick={searchTransfer}>submit</Button>
        </>
    )
}