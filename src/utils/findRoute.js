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

const heuristicWeights = {
	light: 2,
	medium: 1.5,
	normal: 1.1,
};

const EMPTY = [];

// ============================================================
// 起動時に一度だけ作る索引
// ============================================================

// ==== 距離キャッシュ ====
const distanceCache = new Map();

function getDistance(s1, s2) {
	const a = id(s1);
	const b = id(s2);
	const key = a < b ? `${a},${b}` : `${b},${a}`;
	let result = distanceCache.get(key);
	if (result === undefined) {
		result = getD(s1, s2);
		distanceCache.set(key, result);
	}
	return result;
}

// ==== 隣接リスト作成 ====
const graph = new Map();
{
	const seenEdges = new Set();
	for (const e of edges) {
		const key = `${e.from}-${e.to}`;
		if (seenEdges.has(key)) continue;
		seenEdges.add(key);
		let list = graph.get(e.from);
		if (!list) graph.set(e.from, (list = []));
		list.push({ node: e.to, id: id(e.to) });
	}
}

// ==== 駅ID → そのIDを持つノード(コード)一覧 ====
const codesById = new Map();
for (const [c, n] of Object.entries(nodes)) {
	const key = String(n.id);
	let list = codesById.get(key);
	if (!list) codesById.set(key, (list = []));
	list.push(c);
}

// ==== 徒歩経路: from → path ====
const walkPathByFrom = new Map();
for (const p of walkPath) {
	if (!walkPathByFrom.has(p.from)) walkPathByFrom.set(p.from, p);
}

// ==== 重複乗車の例外ルール（ID は前計算） ====
const duplicateRules = allowDuplicateSections
	.map((rule) => ({ fromId: id(rule.fromSta), toId: id(rule.toSta), lines: rule.lines ?? [] }))
	.filter((r) => r.fromId && r.toId);

// ==== 訪問済み集合のハッシュ（Zobrist 方式。XOR で差分更新できる） ====
function hash32(str, seed) {
	let h = seed >>> 0;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	h ^= h >>> 16;
	h = Math.imul(h, 0x85ebca6b);
	h ^= h >>> 13;
	h = Math.imul(h, 0xc2b2ae35);
	h ^= h >>> 16;
	return h >>> 0;
}

const zobristCache = new Map();
function zobrist(item) {
	let z = zobristCache.get(item);
	if (!z) {
		const s = String(item);
		z = [hash32(s, 0x811c9dc5), hash32(s, 0x9747b28c)];
		zobristCache.set(item, z);
	}
	return z;
}

/** 2つの32bitハッシュから 53bit の数値キーを作る */
function visitedKey(h1, h2) {
	return h1 * 2097152 + (h2 >>> 11);
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
const toRad = (d) => (d * Math.PI) / 180;

/** 駅ID同士の距離(m) */
function haversineById(idA, idB) {
	const R = 6371e3; // m
	const a = stations[idA];
	const b = stations[idB];

	const lon1 = toRad(a.lng);
	const lat1 = toRad(a.lat);
	const lon2 = toRad(b.lng);
	const lat2 = toRad(b.lat);

	const dLat = lat2 - lat1;
	const dLon = lon2 - lon1;

	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

	return 2 * R * Math.asin(Math.sqrt(h));
}

function makeStateId(staId, phase, visitedIndex) {
	return `${staId}@${phase}@${visitedIndex}`;
}

/**
 * 重複乗車を許す区間ルールを探す（訪問済み Set の中に from → to の順で入っていて、路線が一致するもの）
 */
function findAllowedDuplicateRule(station, nextStation, nextId, visited) {
	if (duplicateRules.length === 0 || !nextId) return null;

	const currentLine = nodes[station]?.json;
	const targetLine = nodes[nextStation]?.json;

	let order = null;
	for (const rule of duplicateRules) {
		if (!visited.has(rule.fromId) || !visited.has(rule.toId)) continue;

		order ??= [...visited];
		const fromIndex = order.lastIndexOf(rule.fromId);
		const toIndex = order.lastIndexOf(rule.toId);
		if (toIndex <= fromIndex) continue;

		if (rule.lines.includes(currentLine) || rule.lines.includes(targetLine)) return rule;
	}
	return null;
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
 * @param {number} transferTime 乗換にかかる時間（秒）
 * @param {boolean} tokkyu 有料列車（特急 or ライナー）を許可するかどうか
 * @param {string} heuristicMode ヒューリスティックの重み (light, medium, normal)
 * @param {boolean} allowOuterTransfer 改札外乗り換えを許可するかどうか
 * @defaultValue allowOuterTransfer = false
 * @param {Array<string>} passStations 必ず通過する駅（順序あり）
 * @returns 経路の詳細情報（reconstructByState の戻り値）。見つからなければ null
 */
export async function dijkstra(start, goal, baseTime, mode, transferTime, tokkyu, heuristicMode, allowOuterTransfer = false, passStations = []) {
	const pq = new MinHeap();

	const bestTime = new Map();
	const bestTransfer = new Map();
	const rideVer = new Map(); // ride 状態の更新回数（古い push を捨てるため）
	const previous = {};
	const used = {};

	// 訪問済み集合は (ハッシュ) → 通し番号 で共有する
	const visitedStore = []; // { set, h1, h2 }
	const visitedPool = new Map();
	const internVisited = (h1, h2, build) => {
		const key = visitedKey(h1, h2);
		let idx = visitedPool.get(key);
		if (idx === undefined) {
			idx = visitedStore.length;
			visitedStore.push({ set: build(), h1, h2 });
			visitedPool.set(key, idx);
		}
		return idx;
	};

	const startStation = mode === 0 ? code(start) : code(goal);
	const goalStation = mode === 0 ? code(goal) : code(start);
	const startId = id(startStation);
	const goalId = id(goalStation);

	const distance = getDistance(id(start), id(goal));
	const farLimit = distance * 1000 * 1.3;

	const header = {
		from: id(start),
		to: id(goal),
		distance,
		fare: getFare(distance),
	};

	// ---- 探索中は出発・到着が固定なので、駅ごとの距離は一度だけ計算する ----
	const toGoalCache = new Map();
	const fromStartCache = new Map();
	const distToGoal = (staId) => {
		let v = toGoalCache.get(staId);
		if (v === undefined) {
			v = haversineById(staId, goalId);
			toGoalCache.set(staId, v);
		}
		return v;
	};
	const distFromStart = (staId) => {
		let v = fromStartCache.get(staId);
		if (v === undefined) {
			v = haversineById(startId, staId);
			fromStartCache.set(staId, v);
		}
		return v;
	};

	const goalNodeExists = !!nodes[code(goalStation)];
	const heuristicWeight = heuristicWeights[heuristicMode];
	const hCache = new Map();
	const heuristicOf = (station) => {
		let v = hCache.get(station);
		if (v === undefined) {
			v = goalNodeExists && nodes[code(station)] ? distToGoal(id(station)) / MAX_SPEED : 0;
			hCache.set(station, v);
		}
		return v;
	};

	const makePriority = (time, station, transfer) => ({
		priority: Math.abs(time - baseTime) + heuristicOf(station) * heuristicWeight,
		tie: transfer,
	});

	// 駅ごとの「各駅間で残す列車の最大数」
	const sliceCache = new Map();
	const sliceLimitOf = (staId) => {
		let v = sliceCache.get(staId);
		if (v === undefined) {
			v = Math.max(3, Math.ceil(getDistance(staId, goalId) / 12));
			sliceCache.set(staId, v);
		}
		return v;
	};

	const passIds = passStations.map((s) => id(s));

	// ---- 開始状態 ----
	for (const c of Object.keys(nodes)) {
		if (id(c) !== startId) continue;

		const staId = id(c);
		const z = zobrist(staId);
		const visitedIndex = internVisited(z[0], z[1], () => new Set([staId]));
		const startStateId = makeStateId(staId, 'transfer', visitedIndex);

		bestTime.set(startStateId, baseTime);
		bestTransfer.set(startStateId, 0);

		pq.push({
			station: c,
			time: baseTime,
			phase: 'transfer',
			visitedIndex,
			transfer: 0,
			...makePriority(baseTime, c, 0),
		});
	}

	let goalStateId = null;

	while (true) {
		const cur = pq.pop();
		if (!cur) break;

		const { station, time, phase, visitedIndex, transfer } = cur;
		const stationId = id(station);
		const curStateId = makeStateId(stationId, phase, visitedIndex);

		// より良い状態で上書きされた古いエントリは捨てる
		if (phase === 'ride' && rideVer.get(curStateId) !== cur.ver) continue;

		const { set: visited, h1: vh1, h2: vh2 } = visitedStore[visitedIndex];

		// === ゴール ===
		if (stationId === goalId && phase === 'ride') {
			if (passIds.length === 0 || containsInOrder([...visited], passIds)) {
				goalStateId = curStateId;
				header.visited = [...visited].map((s) => id(s));
				break;
			} else {
				continue;
			}
		}

		// === 枝切り(?) ===
		if (distFromStart(stationId) + distToGoal(stationId) > farLimit) {
			continue;
		}

		// ===== ride → transfer =====
		if (phase === 'ride') {
			const nextTime = time;

			const codes = codesById.get(String(stationId)) ?? EMPTY;
			for (const nextCode of codes) {
				if (nodes[nextCode].line === '徒歩経路' && !allowOuterTransfer) continue;
				const staId = id(nextCode);

				let nextIndex = visitedIndex;
				if (!visited.has(staId)) {
					const z = zobrist(staId);
					nextIndex = internVisited((vh1 ^ z[0]) >>> 0, (vh2 ^ z[1]) >>> 0, () => {
						const s = new Set(visited);
						s.add(staId);
						return s;
					});
				}

				const nextStateId = makeStateId(staId, 'transfer', nextIndex);
				const best = bestTime.get(nextStateId);

				if (best === undefined || (mode === 0 && nextTime <= best) || (mode === 1 && nextTime >= best)) {
					bestTime.set(nextStateId, nextTime);
					bestTransfer.set(nextStateId, transfer);
					previous[nextStateId] = curStateId;

					pq.push({
						station: nextCode,
						time: nextTime,
						phase: 'transfer',
						visitedIndex: nextIndex,
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
				const path = walkPathByFrom.get(station);
				if (!path) continue;

				const toId = id(path.to);
				if ([...visited].some((s) => id(s) === toId)) continue;

				// 乗換時間は ride の push 時ではなく、ここ（次の乗車/徒歩の開始時）で見込む
				const walkStart = previous[curStateId] === undefined ? time : time + transferTime;
				const nextTime = walkStart + path.time;
				const nextTransfer = transfer + 1;

				const z = zobrist(toId);
				const nextIndex = internVisited((vh1 ^ z[0]) >>> 0, (vh2 ^ z[1]) >>> 0, () => {
					const s = new Set(visited);
					s.add(toId);
					return s;
				});

				const nextStateId = makeStateId(toId, 'ride', nextIndex);

				bestTime.set(nextStateId, nextTime);
				bestTransfer.set(nextStateId, nextTransfer);
				previous[nextStateId] = curStateId;
				used[nextStateId] = {
					train: 'walking',
					arr: nextTime,
					dep: walkStart,
					from: station,
					to: path.to,
					viaRosen: ['徒歩経路'],
					meter: path.meter,
				};
				const ver = (rideVer.get(nextStateId) ?? 0) + 1;
				rideVer.set(nextStateId, ver);

				pq.push({
					station: path.to,
					time: nextTime,
					phase: 'ride',
					visitedIndex: nextIndex,
					transfer: nextTransfer,
					ver,
					...makePriority(nextTime, path.to, nextTransfer),
				});
			} else {
				const sliceLimit = sliceLimitOf(stationId);

				// 直前に乗っていた列車（この transfer 状態に至る ride 状態の used）
				const prevRide = previous[curStateId];
				const hasPrev = prevRide !== undefined;
				const prevNumber = hasPrev ? used[prevRide]?.train?.number : undefined;
				// 列車番号が同じ列車への継続は乗換ではない（番号が空/未定義なら継続とみなさない）
				const canContinue = prevNumber != null && prevNumber !== '';
				const isContinuation = (result) => canContinue && result.train?.number === prevNumber;
				// 乗換が必要な列車は「到着 + 乗換時間」以降、継続なら到着直後から乗れる
				const searchTime = hasPrev ? time + transferTime : time;

				// --- 隣接駅ごとの検索対象を決める（不正乗車、ダメゼッタイ） ---
				const jobs = [];
				for (const nb of graph.get(station) ?? EMPTY) {
					const duplicateRule = findAllowedDuplicateRule(station, nb.node, nb.id, visited);
					if (visited.has(nb.id) && !duplicateRule) continue;
					jobs.push({
						nb,
						allowed: duplicateRule ? [duplicateRule.fromId] : EMPTY,
						// 路線をまたぐ辺だけ「同一列車の継続」を別検索する
						// （同一路線内の継続は searchOtherStops が1回の乗車として列挙済みのため不要）
						crossLine: canContinue && nodes[station].json !== nodes[nb.node]?.json,
					});
				}

				// --- 時刻表検索は並列に実行（結果の処理順は元の順序のまま） ---
				const resolved = await Promise.all(
					jobs.map(async ({ nb, allowed, crossLine }) => {
						const fromSta = mode === 0 ? station : nb.node;
						const toSta = mode === 0 ? nb.node : station;

						const [fromTransferTrains, continuingTrains] = await Promise.all([
							searchFastestTrain(searchTime, fromSta, toSta, mode, tokkyu, visited, allowed, sliceLimit),
							crossLine
								? searchFastestTrain(time, fromSta, toSta, mode, tokkyu, visited, allowed, sliceLimit, prevNumber)
								: EMPTY,
						]);

						const results = [...fromTransferTrains];
						for (const r of continuingTrains) {
							if (!results.some((a) => a.train === r.train && a.dep === r.dep)) results.push(r);
						}

						return Promise.all(
							results
								.filter((result) => result?.train)
								.map(async (result) => ({
									result,
									other: await searchOtherStops(
										mode === 0 ? station : nb.node,
										mode === 0 ? result.dep : result.arr,
										result.train,
										visited,
										mode,
										allowed,
									),
								})),
						);
					}),
				);

				for (const runs of resolved) {
					for (const { result, other } of runs) {
						const newTransfer = !isContinuation(result);
						const nextTransfer = transfer + Number(newTransfer);

						// 同じ列車の結果は trail を共有しているので、ハッシュは差分で伸ばす
						let runTrail = null;
						let runK = 0;
						let runH1 = 0;
						let runH2 = 0;
						let runSeen = null;

						for (const o of other) {
							const { to, arr, dep, trail, trailLen, viaRosen } = o;
							const nextTime = mode === 0 ? arr : dep;

							if (trail !== runTrail) {
								runTrail = trail;
								runK = 0;
								runH1 = vh1;
								runH2 = vh2;
								runSeen = null;
							}
							for (; runK < trailLen; runK++) {
								const item = trail[runK];
								if (visited.has(item) || runSeen?.has(item)) continue;
								(runSeen ??= new Set()).add(item);
								const z = zobrist(item);
								runH1 = (runH1 ^ z[0]) >>> 0;
								runH2 = (runH2 ^ z[1]) >>> 0;
							}

							const toId = id(to);
							const key = visitedKey(runH1, runH2);
							let nextIndex = visitedPool.get(key);

							let best;
							let nextStateId = null;
							if (nextIndex !== undefined) {
								nextStateId = makeStateId(toId, 'ride', nextIndex);
								best = bestTime.get(nextStateId);
							}

							const better =
								best === undefined ||
								(mode === 0 && nextTime < best) ||
								(mode === 1 && nextTime > best) ||
								(nextTime === best && bestTransfer.get(nextStateId) > nextTransfer);
							if (!better) continue;
							if (!(distToGoal(toId) < distToGoal(stationId) + 10000)) continue; // isForward

							// 採用する状態だけ訪問済み集合を実体化する
							if (nextIndex === undefined) {
								const set = new Set(visited);
								for (let k = 0; k < trailLen; k++) set.add(trail[k]);
								nextIndex = visitedStore.length;
								visitedStore.push({ set, h1: runH1, h2: runH2 });
								visitedPool.set(key, nextIndex);
								nextStateId = makeStateId(toId, 'ride', nextIndex);
							}

							bestTime.set(nextStateId, nextTime);
							bestTransfer.set(nextStateId, nextTransfer);
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
							const ver = (rideVer.get(nextStateId) ?? 0) + 1;
							rideVer.set(nextStateId, ver);

							pq.push({
								station: to,
								time: nextTime,
								phase: 'ride',
								visitedIndex: nextIndex,
								transfer: nextTransfer,
								ver,
								...makePriority(nextTime, to, nextTransfer),
							});
						}
					}
				}
			}
		}
	}

	if (!goalStateId) return null;
	return reconstructByState(goalStateId, previous, used, mode, header);
}
