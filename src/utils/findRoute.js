import reconstructByState from "./formatRoute.js";
import { searchFastestTrain } from "./searchFastestTrain.js";
import { name } from "./Station.js";

import edges from "../data/edges.json";
import nodes from "../data/nodes.json";
import stations from "../data/stations.json";
import { dia } from "./readOud.js";

const MAX_SPEED = 100 * 1000 / 3600; // m/s for heuristic
const TRANSFER_COST = 0.75; // for heuristic

/**
 * 同じ列車で行ける駅の到着、出発時刻を探す
 * @param {string} station 出発駅
 * @param {number} time 時刻
 * @param {Object} train 乗車電
 * @param {Array<string>} passing 経由駅
 * @param {0|1} mode mode
 * @returns {Array<{to: string, arr: number, dep: number}>} to駅名、到着時刻、出発時刻
 */
async function searchOtherStops(station, time, train, passing, mode) {
    const diagram = await dia(nodes[station].json);
    const modeNum = mode === 0 ? 1 : -1;
    let from = diagram.railway.stations.findIndex(sta => sta.name === station);
    if (train.direction === 1) from = diagram.railway.stations.length - 1 - from;
    const result = [];
    const newVisited = passing
    for (let i = from + modeNum; (i >= train.timetable.firstStationIndex && i <= train.timetable.terminalStationIndex); i += modeNum) {
        const to = train.timetable._data[i];
        const toCode = diagram.railway.stations[train.direction === 0 ? i : diagram.railway.stations.length - 1 - i].name;
        if (!to || (to.stopType !== 1 && to.stopType !== 2)) continue;
        if (newVisited.some(sta => name(sta) == name(toCode))) break;
        newVisited.push(toCode);
        if (to.stopType !== 1 || (mode === 0 && to.arrival === null) || (mode === 1 && to.departure === null)) continue;
        const arr = to.arrival + Math.trunc(time / 86400) * 86400;
        const dep = to.departure + Math.trunc(time / 86400) * 86400;
        result.push({
            to: toCode,
            arr,
            dep,
            newVisited: [...newVisited]
        })
    }
    return result;
}

// ==== 隣接リスト作成 ====
const graph = {};
const seenEdges = new Set();
for (const e of edges) {
    const key = `${e.from}-${e.to}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    if (!graph[e.from]) graph[e.from] = [];
    graph[e.from].push({ node: e.to });
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

// A*関係
function haversine(a, b) {
    const R = 6371e3; // m
    const toRad = d => d * Math.PI / 180;

    const lon1 = toRad(stations[name(a)].lng);
    const lat1 = toRad(stations[name(a)].lat);
    const lon2 = toRad(stations[name(b)].lng);
    const lat2 = toRad(stations[name(b)].lat);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

function heuristic(sta, goal) {
    if (!nodes[sta] || !nodes[goal]) return 0;
    return haversine(sta, goal) / MAX_SPEED;
}

function makeStateId(sta, phase, visited) {
    return `${name(sta)}@${phase}@${visitedKey(visited)}`;
}

function visitedKey(visited) {
    const newVisitedArray = [...visited].map(name).sort();
    const newVisitedSet = new Set(newVisitedArray);
    return [...newVisitedSet].join(",");
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
    const bestTransfer = {};
    const previous = {};
    const used = {};

    const startStation = mode === 0 ? start : goal;
    const goalStation = mode === 0 ? goal : start;

    Object.keys(nodes).filter(code => name(code) === name(startStation)).forEach(code => {

        const startVisited = new Set([code]);
        const startStateId = makeStateId(code, "transfer", startVisited);

        bestTime[startStateId] = baseTime;
        bestTransfer[startStateId] = 0;

        pq.push({
            station: code,
            time: baseTime,
            phase: "transfer",
            visited: startVisited,
            priority: baseTime + heuristic(startStation, goalStation),
            transfer: 0
        });

    });

    let goalStateId = null;

    while (true) {
        const cur = pq.pop();
        if (!cur) break;

        const { station, time, phase, visited, transfer } = cur;
        const curStateId = makeStateId(station, phase, visited);

        // === ゴール ===
        if (name(station) === name(goalStation) && phase === "ride") {
            goalStateId = curStateId;
            break;
        }

        // ===== ride → transfer =====
        if (phase === "ride") {
            const nextTime = time;

            const codes = Object.entries(nodes).filter(sta => sta[1].name == name(station)).map(sta => sta[0]);
            for (const nextCode of codes) {
                const nextVisited = new Set(visited);
                nextVisited.add(nextCode);

                const nextStateId = makeStateId(nextCode, "transfer", nextVisited);

                if (
                    bestTime[nextStateId] === undefined ||
                    (mode === 0 && nextTime <= bestTime[nextStateId]) ||
                    (mode === 1 && nextTime >= bestTime[nextStateId])
                ) {
                    bestTime[nextStateId] = nextTime
                    bestTransfer[nextStateId] = transfer
                    previous[nextStateId] = curStateId

                    pq.push({
                        station: nextCode,
                        time: nextTime,
                        phase: "transfer",
                        visited: nextVisited,
                        transfer: transfer,
                        priority: nextTime + heuristic(nextCode, goalStation) + transfer * TRANSFER_COST,
                    })
                }
            }

        }

        // ===== transfer → ride =====
        if (phase === "transfer") {
            for (const { node: nextStation } of graph[station] ?? []) {

                // 駅名ベースのループ防止
                if ([...visited].some(s => name(s) === name(nextStation))) continue;

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

                const other = await searchOtherStops(
                    mode === 0 ? station : nextStation,
                    mode === 0 ? result.arr : result.dep,
                    result.train,
                    visitedArray,
                    mode
                );

                other.forEach(({ to, arr, dep, newVisited: visited }) => {

                    const nextTime = mode === 0 ? arr : dep;

                    const nextVisited = new Set(visited);

                    const nextStateId = makeStateId(
                        to,
                        "ride",
                        nextVisited
                    );

                    if (
                        bestTime[nextStateId] === undefined ||
                        (
                            (mode === 0 && nextTime < bestTime[nextStateId]) ||
                            (mode === 1 && nextTime > bestTime[nextStateId])
                        ) ||
                        (
                            nextTime === bestTime[nextStateId] &&
                            bestTransfer[nextStateId] > transfer + 1
                        )
                    ) {
                        bestTime[nextStateId] = nextTime;
                        bestTransfer[nextStateId] = transfer + 1;
                        previous[nextStateId] = curStateId;
                        used[nextStateId] = {
                            ...result,
                            arr: mode === 0 ? arr : result.arr,
                            dep: mode === 1 ? dep : result.dep,
                            from: station,
                            to: to
                        };

                        let nextTransfer = transfer;
                        if (used[curStateId]?.train?.number !== result.train?.number || used[curStateId]?.train?.number === '' || result?.train?.number === '') {
                            nextTransfer++;
                        }

                        pq.push({
                            station: to,
                            time: nextTime,
                            phase: "ride",
                            visited: nextVisited,
                            transfer: nextTransfer,
                            priority: nextTime + heuristic(to, goalStation) + nextTransfer * TRANSFER_COST,
                        });
                    }
                })
            }
        }

    }

    if (!goalStateId) return null;
    return reconstructByState(goalStateId, previous, used, mode);
}

