import reconstructByState from './formatRoute.js';
import getD from './getDistance.js';
import getFare from './getFare.js';
import { searchFastestTrain, searchOtherStops } from './searchFastestTrain.js';
import { code, id } from './Station.js';

import edges from '../data/edges.json';
import fareExceptions from '../data/fareExceptions.json';
import nodes from '../data/nodes.json';
import stations from '../data/stations.json';
import walkPath from '../data/walkPath.json';

const MAX_SPEED = (35 * 1000) / 3600; // m/s for heuristic
const allowDuplicateSections = fareExceptions?.allowDuplicates ?? [];
const SHORT_ROUTE_THRESHOLD = 15 * 1000; // 15km までは重みを強めずに精度優先
const LONG_ROUTE_THRESHOLD = 30 * 1000; // 30km 以上ではヒューリスティックを強める

const heuristicWeights = {
	light: [1.5, 1.7, 2.5],
	medium: [1.2, 1.4, 1.6],
	normal: [1, 1.6, 1.8],
};

const distanceCache = new Map();

function getDistanceCacheKey(couple) {
	return couple.map(id).sort().join(',');
}

function getDistance(s1, s2) {
	const key = getDistanceCacheKey([s1, s2]);
	if (distanceCache.has(key)) return distanceCache.get(key);
	const result = getD(s1, s2);
	distanceCache.set(key, result);
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
		if (!end) return null;
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
			if (parent.priority < current.priority || (parent.priority === current.priority && parent.tie <= current.tie)) break;
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
				if (left.priority < best.priority || (left.priority === best.priority && left.tie < best.tie)) m = l;
			}
			if (r < n) {
				const right = this.heap[r];
				const best = this.heap[m];
				if (right.priority < best.priority || (right.priority === best.priority && right.tie < best.tie)) m = r;
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

	const lon1 = toRad(stations[id(a)].lng);
	const lat1 = toRad(stations[id(a)].lat);
	const lon2 = toRad(stations[id(b)].lng);
	const lat2 = toRad(stations[id(b)].lat);

	const dLat = lat2 - lat1;
	const dLon = lon2 - lon1;

	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

	return 2 * R * Math.asin(Math.sqrt(h));
}

function heuristic(sta, goal) {
	if (!nodes[code(sta)] || !nodes[code(goal)]) return 0;
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
	return `${id(sta)}@${phase}@${visitedIndex}`;
}

function setKey(sta, set) {
	return `${id(sta)}@${[...set].sort().join(',')}`;
}

function findAllowedDuplicateRule(station, nextStation, visitedArray) {
	const nextStationId = id(nextStation);
	if (!nextStationId) return null;

	const visitedIds = (visitedArray ?? []).map((s) => id(s)).filter(Boolean);
	const currentLine = nodes[station]?.json;
	const targetLine = nodes[nextStation]?.json;

	return (
		allowDuplicateSections.find((rule) => {
			const fromId = id(rule.fromSta);
			const toId = id(rule.toSta);
			if (!fromId || !toId) return false;

			const fromIndex = visitedIds.lastIndexOf(fromId);
			const toIndex = visitedIds.lastIndexOf(toId);
			if (fromIndex === -1 || toIndex === -1 || toIndex <= fromIndex) return false;

			return [currentLine, targetLine].some((line) => rule.lines.includes(line));
		}) ?? null
	);
}

function containsInOrder(parent, sub) {
	let subIndex = 0;
	for (const item of parent) {
		if (item === sub[subIndex]) {
			subIndex++;
			if (subIndex === sub.length) return true;
		}
	}
	return sub.length === 0;
}

/**
 * 経路を探索し、経路の詳細を返す
 * @param {string} start 出発駅（ナンバリング）
 * @param {string} goal 到着駅（ナンバリング）
 * @param {number} baseTime 出発時刻（mode=0）または到着時刻（mode=1）
 * @param {number} mode 出発時刻から検索(0) or 到着時刻から検索(1)
 * @param {boolean} tokkyu 有料列車（特急 or ライナー）を許可するかどうか
 * @param {string} heuristicMode ヒューリスティックの重み (light, medium, normal)
 * @param {boolean} allowOuterTransfer 改札外乗り換えを許可するかどうか
 * @defaultValue allowOuterTransfer = false
 * @returns {[{train: string, from: string, to: string, depTime: number, arrTime: number, terminal: string, typeName: string, line: string}, ...]} 経路の詳細情報の配列
 */

export async function dijkstra(start, goal, baseTime, mode, transferTime, tokkyu, heuristicMode, allowOuterTransfer = false, passStations = []) {
	const pq = new MinHeap();

	const bestTime = {};
	const bestTransfer = {};
	const previous = {};
	const used = {};
	const visiteds = {};
	const visitedPool = new Map();

	const getVisitedIndex = (sta, set) => {
		const key = setKey(sta, set);

		if (visitedPool.has(key)) {
			return visitedPool.get(key);
		}

		visiteds[sta] ??= [];
		const index = visiteds[sta].length;
		visiteds[sta].push(set);
		visitedPool.set(key, index);
		return index;
	};

	const startStation = mode === 0 ? code(start) : code(goal);
	const goalStation = mode === 0 ? code(goal) : code(start);

	const distance = getDistance(id(start), id(goal));

	const header = {
		from: id(start),
		to: id(goal),
		distance,
		fare: getFare(distance),
	};

	const makePriority = (time, station, transfer) => {
		const h = heuristic(station, goalStation);
		let heuristicWeight = heuristicWeights[heuristicMode][0];

		if (distance >= LONG_ROUTE_THRESHOLD) {
			heuristicWeight = heuristicWeights[heuristicMode][2];
		} else if (distance >= SHORT_ROUTE_THRESHOLD) {
			heuristicWeight = heuristicWeights[heuristicMode][1];
		}

		return {
			priority: Math.abs(time - baseTime) + h * heuristicWeight,
			tie: transfer,
		};
	};

	Object.keys(nodes)
		.filter((code) => id(code) === id(startStation))
		.forEach((code) => {
			const staId = id(code);

			const startVisited = new Set([staId]);
			const visitedIndex = getVisitedIndex(staId, startVisited);

			const startStateId = makeStateId(code, 'transfer', visitedIndex);

			bestTime[startStateId] = baseTime;
			bestTransfer[startStateId] = 0;

			pq.push({
				station: code,
				time: baseTime,
				phase: 'transfer',
				visitedIndex,
				transfer: 0,
				...makePriority(baseTime, code, 0),
			});
		});

	let goalStateId = null;

	while (true) {
		const cur = pq.pop();
		if (!cur) {
			break;
		}

		const { station, time, phase, visitedIndex, transfer } = cur;
		const visited = visiteds[id(station)][visitedIndex];
		const curStateId = makeStateId(station, phase, visitedIndex);

		// === ゴール ===
		if (id(station) === id(goalStation) && phase === 'ride') {
			if (
				containsInOrder(
					[...visited],
					passStations.map((s) => id(s)),
				)
			) {
				goalStateId = curStateId;
				header.visited = [...visited].map((s) => id(s));
				break;
			} else {
				continue;
			}
		}

		// === 枝切り(?) ===
		if (isFar(startStation, station, goalStation, distance)) {
			continue;
		}

		// ===== ride → transfer =====
		if (phase === 'ride') {
			const nextTime = time;

			const codes = Object.entries(nodes)
				.filter((sta) => sta[1].id == id(station))
				.map((sta) => sta[0]);
			for (const nextCode of codes) {
				if (nodes[nextCode].line === '徒歩経路' && !allowOuterTransfer) continue;
				const staId = id(nextCode);
				const nextVisited = new Set(visited);
				nextVisited.add(staId);

				const visitedIndex = getVisitedIndex(staId, nextVisited);

				const nextStateId = makeStateId(nextCode, 'transfer', visitedIndex);

				if (
					bestTime[nextStateId] === undefined ||
					(mode === 0 && nextTime <= bestTime[nextStateId]) ||
					(mode === 1 && nextTime >= bestTime[nextStateId])
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
				if ([...visited].some((s) => id(s) === id(path.to))) continue;

				const staId = id(path.to);
				const nextTime = time + path.time;
				const nextTransfer = transfer + 1;
				const nextVisited = new Set([...visited, staId]);

				const visitedIndex = getVisitedIndex(staId, nextVisited);

				const nextStateId = makeStateId(path.to, 'ride', visitedIndex);

				bestTime[nextStateId] = nextTime;
				bestTransfer[nextStateId] = nextTransfer;
				previous[nextStateId] = curStateId;
				used[nextStateId] = {
					train: 'walking',
					arr: nextTime,
					dep: time,
					from: station,
					to: path.to,
					viaRosen: ['徒歩経路'],
					meter: path.meter,
				};

				pq.push({
					station: path.to,
					time: nextTime + transferTime,
					phase: 'ride',
					visitedIndex,
					transfer: nextTransfer,
					...makePriority(nextTime, path.to, nextTransfer),
				});
			} else {
				for (const { node: nextStation } of graph[station] ?? []) {
					// 不正乗車、ダメゼッタイ
					const visitedArray = [...visited];
					const duplicateRule = findAllowedDuplicateRule(station, nextStation, visitedArray);
					if (visitedArray.includes(id(nextStation)) && !duplicateRule) continue;

					const searchVisited = visitedArray;

					const results = await searchFastestTrain(
						time,
						mode === 0 ? station : nextStation,
						mode === 0 ? nextStation : station,
						mode,
						tokkyu,
						searchVisited,
						duplicateRule ? [id(duplicateRule.fromSta)] : [],
					).then((res) => res.slice(0, Math.max(3, Math.ceil(getDistance(id(station), id(goalStation)) / 12))));

					for (const result of results) {
						if (!result?.train) continue;

						const other = await searchOtherStops(
							mode === 0 ? station : nextStation,
							mode === 0 ? result.dep : result.arr,
							result.train,
							searchVisited,
							mode,
							duplicateRule ? [id(duplicateRule.fromSta)] : [],
						);

						for (const { to, arr, dep, newVisited: visited, viaRosen } of other) {
							const nextTime = mode === 0 ? arr : dep;

							const nextVisited = new Set(visited);

							const staId = id(to);
							const visitedIndex = getVisitedIndex(staId, nextVisited);

							const nextStateId = makeStateId(to, 'ride', visitedIndex);

							const newTransfer =
								used[curStateId]?.train?.number !== result.train?.number ||
								used[curStateId]?.train?.number === '' ||
								result?.train?.number === '';
							const nextTransfer = transfer + Number(newTransfer);

							if (
								(bestTime[nextStateId] === undefined ||
									(mode === 0 && nextTime < bestTime[nextStateId]) ||
									(mode === 1 && nextTime > bestTime[nextStateId]) ||
									(nextTime === bestTime[nextStateId] && bestTransfer[nextStateId] > nextTransfer)) &&
								isForward(station, to, goalStation, 10000)
							) {
								bestTime[nextStateId] = nextTime;
								bestTransfer[nextStateId] = nextTransfer;
								previous[nextStateId] = curStateId;
								used[nextStateId] = {
									...result,
									arr: mode === 0 ? arr : result.arr,
									dep: mode === 1 ? dep : result.dep,
									from: station,
									to: to,
									viaRosen,
									lastRosen: result.lastRosen,
								};

								pq.push({
									station: to,
									time: nextTime + Number(newTransfer) * transferTime,
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

	if (!goalStateId) return null;
	return reconstructByState(goalStateId, previous, used, mode, header);
}
