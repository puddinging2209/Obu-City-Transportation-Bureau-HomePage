import edges from "../data/edges.json";

import { searchFastestTrain } from "./searchFastestTrain.js";

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

    let currentTrain = null
    let fromSta = null
    let depTime = null
    let lastArrTime = null
    let lastTo = null

    for (let i = 1; i < states.length; i++) {
        const curUsed = used[states[i]]
        if (!curUsed || !curUsed.train) continue

        // --- segment 開始 ---
        if (currentTrain === null) {
            currentTrain = curUsed.train
            fromSta = curUsed.from
            depTime = curUsed.dep
        }

        // --- 列車が変わったら segment 確定 ---
        if (curUsed.train !== currentTrain) {
            segments.push({
                train: currentTrain,
                from: fromSta,
                to: lastTo,
                depTime,
                arrTime: lastArrTime
            })

            // 新しい列車
            currentTrain = curUsed.train
            fromSta = curUsed.from
            depTime = curUsed.dep
        }

        // 毎回更新（重要）
        lastArrTime = curUsed.arr
        lastTo = curUsed.to
    }

    // --- 最後の segment を必ず確定 ---
    if (currentTrain !== null) {
        segments.push({
            train: currentTrain,
            from: fromSta,
            to: lastTo,
            depTime,
            arrTime: lastArrTime
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
        ) continue

        if (station === goalStation) {
            goalStateId = `${station}@${time}`
            break
        }

        for (const { node: nextStation } of graph[station] ?? []) {

            console.log(`${station} -> ${nextStation}`)
            const result = await searchFastestTrain(
                station.slice(0, 2),
                time,
                station,
                nextStation,
                mode,
                tokkyu
            )

            if (!result) continue

            const nextTime = mode === 0 ? result.arr : result.dep

            // mode 1: 到着時刻を超えたら不許可
            if (mode === 1 && nextTime > baseTime) continue

            const better =
                bestTime[nextStation] === undefined ||
                (mode === 0 && nextTime < bestTime[nextStation]) ||
                (mode === 1 && nextTime > bestTime[nextStation])

            if (!better) continue

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
