import edges from "../data/edges.json";
import nodes from "../data/nodes.json";

import { searchFastestTrain } from "./searchFastestTrain.js";
import { name } from "./Station.js";

// 経路復元 
function reconstructByState(goalStateId, previous, used, mode) {
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

// ==== 隣接リスト作成 ====
const graph = {};
const seenEdges = new Set();
for (const e of edges) {
    const key = `${e.from}-${e.to}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    if (!graph[e.from]) graph[e.from] = [];
    graph[e.from].push({ node: e.to, cost: e.distance });
}

// ==== 優先度付きキュー（最小ヒープ） ====
class MinHeap {
    constructor() { this.heap = [] }

    push(item) {
        this.heap.push(item)
        this._up(this.heap.length - 1)
    }

    pop() {
        if (this.heap.length === 0) return null
        const top = this.heap[0]
        const end = this.heap.pop()
        if (this.heap.length) {
            this.heap[0] = end
            this._down(0)
        }
        return top
    }

    _up(i) {
        while (i > 0) {
            const p = (i - 1) >> 1
            if (this.heap[p].priority <= this.heap[i].priority) break
                ;[this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]]
            i = p
        }
    }

    _down(i) {
        const n = this.heap.length
        while (true) {
            let l = i * 2 + 1
            let r = l + 1
            let m = i

            if (l < n && this.heap[l].priority < this.heap[m].priority) m = l
            if (r < n && this.heap[r].priority < this.heap[m].priority) m = r
            if (m === i) break

                ;[this.heap[m], this.heap[i]] = [this.heap[i], this.heap[m]]
            i = m
        }
    }
}


function makeStateId(sta, time, phase, visited) {
    return `${name(sta)}@${time}@${phase}@${visitedKey(visited)}`;
}

function visitedKey(visited) {
    console.log(visited);
    return [...visited].map(name).sort().join(",");
}

/**
 * 経路を探索し、経路の詳細を返す
 * @param {string} start 出発駅（ナンバリング）
 * @param {string} goal 到着駅（ナンバリング）
 * @param {number} baseTime 出発時刻（mode=0）または到着時刻（mode=1）
 * @param {number} mode 出発時刻から検索(0) or 到着時刻から検索(1)
 * @param {boolean} tokkyu 有料列車（特急 or ライナー）を許可するかどうか
 * @returns {[{train: string, from: string, to: string, depTime: number, arrTime: number, terminal: string, typeName: string, line: string}, ...]} 経路の詳細情報の配列
 */

export async function dijkstra(start, goal, baseTime, mode, tokkyu) {
    const pq = new MinHeap();

    const bestTime = {};
    const previous = {};
    const used = {};

    const startStation = mode === 0 ? start : goal;
    const goalStation = mode === 0 ? goal : start;

    const startVisited = new Set([startStation]);
    const startStateId = makeStateId(startStation, baseTime, "transfer", startVisited);

    bestTime[startStateId] = baseTime;

    pq.push({
        station: startStation,
        time: baseTime,
        phase: "transfer",
        visited: startVisited,
        priority: baseTime
    });

    pq.push({
        station: startStation,
        time: baseTime,
        phase: "ride",
        visited: startVisited,
        priority: baseTime
    });

    let goalStateId = null;

    while (true) {
        const cur = pq.pop();
        if (!cur) break;
        console.log(pq.heap.map(s => name(s.station)));

        const { station, time, phase, visited } = cur;
        const curStateId = makeStateId(station, time, phase, visited);

        // === ゴール ===
        if (name(station) === name(goalStation) && phase === "ride") {
            goalStateId = curStateId;
            break;
        }

        console.log(visited)

        // ===== ride → transfer =====
        if (phase === "ride") {
            const nextTime = time;

            const codes = Object.keys(nodes).filter(code => name(code) === name(station));
            console.log(codes);
            for (const nextCode of codes) {
                const nextVisited = new Set(visited);
                nextVisited.add(nextCode);

                const nextStateId = makeStateId(station, nextTime, "transfer", nextVisited);

                if (
                    bestTime[nextStateId] === undefined ||
                    nextTime < bestTime[nextStateId]
                ) {
                    console.log('transfer', station, nextCode)
                    bestTime[nextStateId] = nextTime
                    previous[nextStateId] = curStateId

                    pq.push({
                        station: nextCode,
                        time: nextTime,
                        phase: "transfer",
                        visited: nextVisited,
                        priority: nextTime
                    })
                }
            }

        }

        // ===== transfer → ride =====
        if (phase === "transfer") {
            for (const { node: nextStation } of graph[station] ?? []) {

                // 駅名ベースのループ防止
                if ([...visited].some(s => name(s) === name(nextStation))) continue;

                console.log('move', name(station), '->', name(nextStation));

                const visitedArray = [...visited];

                const result = await searchFastestTrain(
                    time,
                    mode === 0 ? station : nextStation,
                    mode === 0 ? nextStation : station,
                    mode,
                    tokkyu,
                    visitedArray
                );

                if (!result?.train) continue;

                const nextTime = mode === 0 ? result.arr : result.dep;

                const nextVisited = new Set(visited);
                result.passing?.forEach(s => nextVisited.add(s));
                nextVisited.add(nextStation);

                const nextStateId = makeStateId(
                    nextStation,
                    nextTime,
                    "ride",
                    nextVisited
                );

                if (
                    bestTime[nextStateId] === undefined ||
                    nextTime < bestTime[nextStateId]
                ) {
                    bestTime[nextStateId] = nextTime;
                    previous[nextStateId] = curStateId;
                    used[nextStateId] = {
                        ...result,
                        from: station,
                        to: nextStation
                    };

                    pq.push({
                        station: nextStation,
                        time: nextTime,
                        phase: "ride",
                        visited: nextVisited,
                        priority: nextTime
                    });
                }
            }
        }

    }

    if (!goalStateId) return null;
    return reconstructByState(goalStateId, previous, used, mode);
}

