import edges from "../data/edges.json";
import nodes from "../data/nodes.json";

import { searchFastestTrain } from "./searchFastestTrain.js";
import { name } from "./Station.js";
import { toTimeString } from "./Time.js";

// 経路復元 
function reconstructByState(goalStateId, previous, used) {
    const states = []
    let cur = goalStateId

    while (cur) {
        states.unshift(cur)
        cur = previous[cur]
    }

    return formatRouteFromStates(states, used)
}

function formatRouteFromStates(states, used) {
    const segments = []

    let current = {
        train: null, detail: { terminal: null, typeName: null }
    }
    let fromSta = null
    let depTime = null
    let lastArrTime = null
    let lastTo = null

    for (let i = 1; i < states.length; i++) {
        const curUsed = used[states[i]]
        if (!curUsed || !curUsed.train) continue

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
                depTime: toTimeString(depTime),
                arrTime: toTimeString(lastArrTime),
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
            train: current,
            from: name(fromSta),
            to: name(lastTo),
            depTime: toTimeString(depTime),
            arrTime: toTimeString(lastArrTime),
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

// ==== Dijkstra ====
export async function dijkstra(
    startStation,
    goalStation,
    baseTime,
    mode,
    tokkyu
) {
    const pq = new MinHeap()

    const bestTime = {}          // station → 最良到着時刻
    const previous = {}          // stateId → stateId
    const used = {}              // stateId → trainResult

    const startStateId = `${startStation}@${baseTime}`
    bestTime[startStation] = baseTime

    pq.push({
        station: startStation,
        time: baseTime,
        priority: mode === 0 ? baseTime : -baseTime
    })

    let goalStateId = null

    while (true) {

        const cur = pq.pop()
        if (!cur) break

        const { station, time } = cur

        // 枝刈り
        if (
            (mode === 0 && time > bestTime[station]) ||
            (mode === 1 && time < bestTime[station])
        ) continue;

        if (station === goalStation) {
            goalStateId = `${station}@${time}`
            break
        }

        for (const { node: nextStation } of graph[station] ?? []) {

            let result = null;
            if (name(station) != name(nextStation)) {
                result = await searchFastestTrain(
                    time,
                    station,
                    nextStation,
                    mode,
                    tokkyu
                );

                if (!result) continue;
            }

            const nextTime = result ? (mode === 0 ? result.arr : result.dep) : time;

            // mode 1: 到着時刻を超えたら不許可
            if (mode === 1 && nextTime > baseTime) continue;

            const better =
                bestTime[nextStation] === undefined ||
                (mode === 0 && nextTime < bestTime[nextStation]) ||
                (mode === 1 && nextTime > bestTime[nextStation])

            if (!better) continue;

            bestTime[nextStation] = nextTime

            const fromId = `${station}@${time}`
            const toId = `${nextStation}@${nextTime}`

            previous[toId] = fromId
            used[toId] = {
                ...result,
                from: station,
                to: nextStation,
            };

            pq.push({
                station: nextStation,
                time: nextTime,
                priority: mode === 0 ? nextTime : -nextTime
            })
        }
    }

    if (!goalStateId) return null

    return reconstructByState(goalStateId, previous, used)
}
