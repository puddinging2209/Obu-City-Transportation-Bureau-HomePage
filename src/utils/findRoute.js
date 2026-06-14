import reconstructByState from './formatRoute.js';
import getDistance from './getDistance.js';
import { dia } from './readOud.js';
import { searchFastestTrain, searchOtherStops } from './searchFastestTrain.js';
import { name } from './Station.js';

import edges from '../data/edges.json';
import nodes from '../data/nodes.json';
import stations from '../data/stations.json';
import walkPath from '../data/walkPath.json';

const MAX_SPEED = (40 * 1000) / 3600; // m/s for heuristic

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
    constructor() {
        this.heap = [];
    }

    push(item) {
        this.heap.push(item);
        this._up(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        const top = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length) {
            this.heap[0] = end;
            this._down(0);
        }
        return top;
    }

    _up(i) {
        while (i > 0) {
            const p = (i - 1) >> 1;
            const parent = this.heap[p];
            const current = this.heap[i];
            if (
                parent.priority < current.priority ||
                (parent.priority === current.priority && parent.tie <= current.tie)
            )
                break;
            [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
            i = p;
        }
    }

    _down(i) {
        const n = this.heap.length;
        while (true) {
            let l = i * 2 + 1;
            let r = l + 1;
            let m = i;

            if (l < n) {
                const left = this.heap[l];
                const best = this.heap[m];
                if (
                    left.priority < best.priority ||
                    (left.priority === best.priority && left.tie < best.tie)
                )
                    m = l;
            }
            if (r < n) {
                const right = this.heap[r];
                const best = this.heap[m];
                if (
                    right.priority < best.priority ||
                    (right.priority === best.priority && right.tie < best.tie)
                )
                    m = r;
            }
            if (m === i) break;

            [this.heap[m], this.heap[i]] = [this.heap[i], this.heap[m]];
            i = m;
        }
    }
}

// A*関係
function haversine(a, b) {
    const R = 6371e3; // m
    const toRad = (d) => (d * Math.PI) / 180;

    const lon1 = toRad(stations[name(a)].lng);
    const lat1 = toRad(stations[name(a)].lat);
    const lon2 = toRad(stations[name(b)].lng);
    const lat2 = toRad(stations[name(b)].lat);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

function heuristic(sta, goal) {
    if (!nodes[sta] || !nodes[goal]) return 0;
    return haversine(sta, goal) / MAX_SPEED;
}

function isForward(current, next, goal, border = 10000) {
    const d1 = haversine(current, goal);
    const d2 = haversine(next, goal);
    return d2 < d1 + border; // 少し余裕を持たせる
}

function isFar(start, current, goal, d) {
    const d1 = haversine(start, current);
    const d2 = haversine(current, goal);
    return d1 + d2 > d * 1000 * 1.3;
}

function makeStateId(sta, phase, visitedIndex) {
    return `${name(sta)}@${phase}@${visitedIndex}`;
}

function setKey(sta, visitedNames) {
    return `${name(sta)}@${[...visitedNames].sort().join(',')}`;
}

function addVisited(visitedNames, stationCode) {
    const staName = name(stationCode);
    if (visitedNames.includes(staName)) return visitedNames;
    return [...visitedNames, staName].sort();
}

/**
 * 経路を探索し、経路の詳細を返す
 * @param {string} start 出発駅（ナンバリング）
 * @param {string} goal 到着駅（ナンバリング）
 * @param {number} baseTime 出発時刻（mode=0）または到着時刻（mode=1）
 * @param {number} mode 出発時刻から検索(0) or 到着時刻から検索(1)
 * @param {boolean} tokkyu 有料列車（特急 or ライナー）を許可するかどうか
 * @param {boolean} allowOuterTransfer 改札外乗り換えを許可するかどうか
 * @default allowOuterTransfer = false
 * @returns {[{train: string, from: string, to: string, depTime: number, arrTime: number, terminal: string, typeName: string, line: string}, ...]} 経路の詳細情報の配列
 */

export async function dijkstra(
    start,
    goal,
    baseTime,
    mode,
    transferTime,
    tokkyu,
    allowOuterTransfer = false,
) {
    // メインループを非同期にする必要があります
    const pq = new MinHeap();

    const bestTime = {};
    const bestTransfer = {};
    const previous = {};
    const used = {};
    const visiteds = {};
    const visitedPool = new Map();

    const getVisitedIndex = (sta, visitedCodes) => {
        const normalized = Array.from(visitedCodes).slice().sort();
        const key = setKey(sta, normalized);

        if (visitedPool.has(key)) {
            return visitedPool.get(key);
        }

        visiteds[sta] ??= [];
        const index = visiteds[sta].length;
        visiteds[sta].push(normalized);
        visitedPool.set(key, index);
        return index;
    };

    const startStation = mode === 0 ? start : goal;
    const goalStation = mode === 0 ? goal : start;

    const distance = getDistance(startStation.slice(0, 4), goalStation.slice(0, 4));

    // ヒューリスティックの影響をやや抑える（mode=1でも安定させる目的）
    const HEURISTIC_WEIGHT = 0.2;
    const makePriority = (time, station, transfer) => {
        const elapsed = mode === 0 ? time - baseTime : baseTime - time;
        return {
            priority: elapsed + heuristic(station, goalStation) * HEURISTIC_WEIGHT,
            tie: transfer,
        };
    };

    const initialPhase = mode === 0 ? 'transfer' : 'ride';
    Object.keys(nodes)
        .filter((code) => name(code) === name(startStation))
        .forEach((code) => {
            const startVisited = [name(code)];
            const visitedIndex = getVisitedIndex(name(code), startVisited);

            const startStateId = makeStateId(code, initialPhase, visitedIndex);

            bestTime[startStateId] = baseTime;
            bestTransfer[startStateId] = 0;

            pq.push({
                station: code,
                time: baseTime,
                phase: initialPhase,
                visitedIndex,
                transfer: 0,
                ...makePriority(baseTime, code, 0),
            });
        });

    let goalStateId = null;
    let processedCount = 0;

    while (true) {
        const cur = pq.pop();
        if (!cur) {
            console.log(`[mode=${mode}] キューが空になりました。処理済み: ${processedCount}`);
            console.log(
                `[mode=${mode}] ゴール駅: ${name(goalStation)}, スタート駅: ${name(startStation)}`,
            );
            break;
        }

        const { station, time, phase, visitedIndex, transfer } = cur;
        const visited = visiteds[name(station)][visitedIndex];
        const curStateId = makeStateId(station, phase, visitedIndex);
        processedCount++;

        // === ゴール ===
        const goalPhase = mode === 0 ? 'ride' : 'transfer';
        if (name(station) === name(goalStation) && phase === goalPhase) {
            console.log(`[mode=${mode}] ゴール到達! time=${time}, transfer=${transfer}`);
            const depTime = mode === 0 ? time : baseTime;
            const arrTime = mode === 0 ? baseTime : time;
            console.log(`[mode=${mode}] 所要時間: ${Math.abs(depTime - arrTime)}秒`);
            goalStateId = curStateId;
            break;
        }

        // === 枝切り(?) ===
        if (isFar(startStation, station, goalStation, distance)) {
            if (processedCount <= 10) {
                console.log(`[mode=${mode}] 枝切り: ${name(station)} (phase=${phase})`);
            }
            continue;
        }

        // ===== ride → transfer =====
        if (phase === 'ride') {
            const nextTime = time;

            const codes = Object.entries(nodes)
                .filter((sta) => sta[1].name == name(station))
                .map((sta) => sta[0]);
            for (const nextCode of codes) {
                if (nodes[nextCode].line === '徒歩経路' && !allowOuterTransfer) continue;
                const nextVisited = addVisited(visited, nextCode);

                const staName = name(nextCode);
                const visitedIndex = getVisitedIndex(staName, nextVisited);

                const nextStateId = makeStateId(nextCode, 'transfer', visitedIndex);

                if (
                    bestTime[nextStateId] === undefined ||
                    (mode === 0 && nextTime < bestTime[nextStateId]) ||
                    (mode === 1 && nextTime > bestTime[nextStateId])
                ) {
                    bestTime[nextStateId] = nextTime;
                    bestTransfer[nextStateId] = transfer;
                    previous[nextStateId] = curStateId;

                    pq.push({
                        station: nextCode,
                        time: nextTime,
                        phase: 'transfer',
                        visitedIndex,
                        transfer: transfer,
                        ...makePriority(nextTime, nextCode, transfer),
                    });
                }
            }
        }

        // ===== transfer → ride =====
        if (phase === 'transfer') {
            if (nodes[station].line === '徒歩経路') {
                if (!allowOuterTransfer) continue;
                const path = walkPath.find((path) => path.from === station);
                if (visited.includes(name(path.to))) continue;

                const nextTime = mode === 0 ? time + path.time : time - path.time;
                const nextTransfer = transfer + 1;
                const nextVisited = addVisited(visited, path.to);

                const staName = name(path.to);
                const visitedIndex = getVisitedIndex(staName, nextVisited);

                const nextStateId = makeStateId(path.to, 'ride', visitedIndex);

                if (
                    bestTime[nextStateId] === undefined ||
                    (mode === 0 && nextTime < bestTime[nextStateId]) ||
                    (mode === 1 && nextTime > bestTime[nextStateId]) ||
                    (nextTime === bestTime[nextStateId] && bestTransfer[nextStateId] > nextTransfer)
                ) {
                    bestTime[nextStateId] = nextTime;
                    bestTransfer[nextStateId] = nextTransfer;
                    previous[nextStateId] = curStateId;
                    used[nextStateId] = {
                        train: 'walking',
                        arr: mode === 0 ? nextTime : time,
                        dep: mode === 0 ? time : nextTime,
                        from: station,
                        to: path.to,
                        viaRosen: ['徒歩経路'],
                        meter: path.meter,
                    };

                    pq.push({
                        station: path.to,
                        time: mode === 0 ? nextTime + transferTime : nextTime - transferTime,
                        phase: 'ride',
                        visitedIndex,
                        transfer: nextTransfer,
                        ...makePriority(nextTime, path.to, nextTransfer),
                    });
                }
            } else {
                for (const { node: nextStation } of graph[station] ?? []) {
                    if (!isForward(station, nextStation, goalStation)) continue;
                    if (visited.some((s) => s === name(nextStation))) continue;

                    const results = await searchFastestTrain(
                        time,
                        mode === 0 ? station : nextStation,
                        mode === 0 ? nextStation : station,
                        mode,
                        tokkyu,
                        visited,
                    );

                    for (const result of results) {
                        if (!result?.train) continue;

                        const other = await searchOtherStops(
                            mode === 0 ? station : nextStation,
                            mode === 0 ? result.dep : result.arr,
                            mode === 0 ? result.arr : result.dep,
                            result.train,
                            visited,
                            mode,
                        );

                        for (const { to, arr, dep, newVisited: nextVisitedNames, viaRosen } of other) {
                            const nextTime = mode === 0 ? arr : dep;

                            const nextVisited = addVisited(nextVisitedNames, to);

                            const staName = name(to);
                            const visitedIndex = getVisitedIndex(staName, nextVisited);

                            const nextStateId = makeStateId(to, 'ride', visitedIndex);

                            if (
                                (bestTime[nextStateId] === undefined ||
                                    (mode === 0 && nextTime < bestTime[nextStateId]) ||
                                    (mode === 1 && nextTime > bestTime[nextStateId]) ||
                                    (nextTime === bestTime[nextStateId] &&
                                        bestTransfer[nextStateId] > transfer + 1)) &&
                                isForward(station, to, goalStation, 10000)
                            ) {
                                const newTransfer =
                                    used[curStateId]?.train?.number !== result.train?.number ||
                                    used[curStateId]?.train?.number === '' ||
                                    result?.train?.number === '';
                                const nextTransfer = transfer + Number(newTransfer);

                                bestTime[nextStateId] = nextTime;
                                bestTransfer[nextStateId] = nextTransfer;
                                previous[nextStateId] = curStateId;
                                used[nextStateId] = {
                                    train: { number: result.train?.number ?? '' },
                                    type: result.type,
                                    terminal: result.terminal,
                                    arr: mode === 0 ? arr : result.arr,
                                    dep: mode === 1 ? dep : result.dep,
                                    from: station,
                                    to: to,
                                    viaRosen,
                                    meter: result.meter,
                                };

                                pq.push({
                                    station: to,
                                    time:
                                        mode === 0 ?
                                            nextTime + Number(newTransfer) * transferTime
                                        :   nextTime - Number(newTransfer) * transferTime,
                                    phase: 'ride',
                                    visitedIndex,
                                    transfer: nextTransfer,
                                    ...makePriority(nextTime, to, nextTransfer),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    if (!goalStateId) {
        console.log('見つかりませんでした');
        return null;
    }

    // reconstruct に渡す used を最小限のフルデータで復元する
    const usedForReconstruct = {};
    // collect states from goal to start
    const states = [];
    let cur = goalStateId;
    while (cur) {
        states.push(cur);
        cur = previous[cur];
    }

    // for each used state on path, if train is a lightweight summary, load full train object
    for (const s of states) {
        const u = used[s];
        if (!u) continue;
        if (u.train && typeof u.train === 'object' && !u.train.timetable && u.train.number) {
            try {
                const stationCode = u.from || u.to;
                const diagram = await dia(nodes[stationCode].json);
                const trains = diagram.railway.diagrams[0].trains.flat();
                const full = trains.find((t) => t.number === u.train.number);
                if (full) {
                    usedForReconstruct[s] = { ...u, train: full };
                    continue;
                }
            } catch (e) {
                // fallback to original
            }
        }
        usedForReconstruct[s] = u;
    }

    return reconstructByState(goalStateId, previous, usedForReconstruct, distance, mode);
}
