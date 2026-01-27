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

    return formatRouteFromStates((mode === 0) ? states : states.reverse(), used, mode)
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

/**
 * 経路を探索し、経路の詳細を返す
 * @param {string} start 出発駅（ナンバリング）
 * @param {string} goal 到着駅（ナンバリング）
 * @param {number} baseTime 出発時刻（mode=0）または到着時刻（mode=1）
 * @param {number} mode 出発時刻から検索(0) or 到着時刻から検索(1)
 * @param {boolean} tokkyu 有料列車（特急 or ライナー）を許可するかどうか
 * @returns {[{train: string, from: string, to: string, depTime: number, arrTime: number, terminal: string, typeName: string, line: string}, ...]} 経路の詳細情報の配列
 */
export async function dijkstra(
    start,
    goal,
    baseTime,
    mode,
    tokkyu
) {
    const pq = new MinHeap()

    const bestTime = {}   // stateId → bestTime
    const previous = {}   // stateId → stateId
    const used = {}       // stateId → trainResult

    const startStation = mode === 0 ? start : goal
    const goalStation = mode === 0 ? goal : start

    const startVisited = new Set([startStation])
    const startKey = startStation

    const startStateId = `${startStation}@${baseTime}@${startKey}`

    bestTime[startStateId] = baseTime

    pq.push({
        station: startStation,
        time: baseTime,
        visited: startVisited,
        priority: baseTime
    })

    let goalStateId = null

    while (true) {
        const cur = pq.pop()
        if (!cur) break

        const { station, time, visited } = cur

        const curStateId = `${station}@${time}`

        // ゴール到達
        if (station === goalStation) {
            goalStateId = curStateId
            break;
        }

        for (const { node: nextStation } of graph[station] ?? []) {
            if (
                nextStation !== goalStation &&
                name(station) !== name(nextStation) &&
                [...visited].some(s => name(s) === name(nextStation))
            ) continue

            let result = null
            if (name(station) !== name(nextStation)) {
                console.log(station, nextStation, time);
                result = await searchFastestTrain(
                    time,
                    mode === 0 ? station : nextStation,
                    mode === 0 ? nextStation : station,
                    mode,
                    tokkyu,
                    [...visited].sort()
                )
                if (!result?.train) continue
                if (result.passing.some(s => name(s) === name(goalStation))) continue
            }

            const nextTime = result
                ? (mode === 0 ? result.arr : result.dep)
                : time

            const nextVisited = new Set(visited)
            if (result?.passing) {
                for (const sta of result.passing) {
                    nextVisited.add(sta)
                }
            }
            nextVisited.add(nextStation)

            const nextStateId = `${nextStation}@${nextTime}`

            const isBetter =
                bestTime[nextStateId] === undefined ||
                (mode === 0 && nextTime < bestTime[nextStateId]) ||
                (mode === 1 && nextTime > bestTime[nextStateId])

            if (!isBetter) continue

            bestTime[nextStateId] = nextTime
            previous[nextStateId] = curStateId
            used[nextStateId] = {
                ...result,
                from: mode === 0 ? station : nextStation,
                to: mode === 0 ? nextStation : station
            }

            pq.push({
                station: nextStation,
                time: nextTime,
                visited: nextVisited,
                priority: mode === 0 ? nextTime : -nextTime
            })
        }

    }

    if (!goalStateId) return null

    return reconstructByState(goalStateId, previous, used, mode)
}
