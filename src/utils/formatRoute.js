import { name } from "./Station";

import nodes from "../data/nodes.json";

export default function reconstructByState(goalStateId, previous, used, mode) {
    const states = []
    let cur = goalStateId

    while (cur) {
        states.unshift(cur)
        cur = previous[cur]
    }

    console.log(states);
    return formatRouteFromStates((mode === 0) ? states : states.reverse(), used)
}

function formatRouteFromStates(states, used) {
    console.log(states);
    const segments = []

    let current = {
        train: null, detail: { terminal: null, typeName: null }
    }
    let fromSta = null
    let depTime = null
    let lastArrTime = null
    let lastTo = null

    for (let i = 0; i < states.length; i++) {
        const curUsed = used[states[i]]
        if (!curUsed || !curUsed.train) continue;

        // --- segment 開始 ---
        if (current.train === null) {
            current = { train: curUsed.train, detail: { terminal: curUsed.terminal, typeName: curUsed.type } }
            fromSta = curUsed.from
            depTime = curUsed.dep
        }

        // --- 列車が変わったら segment 確定 ---
        if (curUsed.train !== current.train) {
            segments.push({
                train: current.train,
                from: name(fromSta),
                to: name(lastTo),
                depTime: depTime,
                arrTime: lastArrTime,
                terminal: current.detail.terminal,
                typeName: current.detail.typeName,
                line: nodes[fromSta]?.line
            })

            // 新しい列車
            current = { train: curUsed.train, detail: { terminal: curUsed.terminal, typeName: curUsed.type } }
            fromSta = curUsed.from
            depTime = curUsed.dep
        }

        // 毎回更新（重要）
        lastArrTime = curUsed.arr
        lastTo = curUsed.to
    }

    // --- 最後の segment を必ず確定 ---
    if (current.train !== null) {
        segments.push({
            train: current.train,
            from: name(fromSta),
            to: name(lastTo),
            depTime: depTime,
            arrTime: lastArrTime,
            terminal: current.detail.terminal,
            typeName: current.detail.typeName,
            line: nodes[fromSta]?.line
        })
    }

    return segments
}