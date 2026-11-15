import { dia as readDia } from './readOud.js';
import formatStops from './formatStops.js';
import { id } from './Station.js';
import { adjustTime } from './Time.js';
import { terminal, typeName } from './Train.js';

import nodes from '../data/nodes.json';

const DAY = 86400;
const EMPTY_SET = new Set();

// ============================================================
// 共通ユーティリティ
// ============================================================

/**
 * Promise ごとキャッシュする（読み込み中の二重実行を防ぐ）。失敗したらキャッシュから外す。
 */
function memoAsync(map, key, factory) {
	let p = map.get(key);
	if (p === undefined) {
		p = Promise.resolve().then(factory);
		map.set(key, p);
		p.catch(() => {
			if (map.get(key) === p) map.delete(key);
		});
	}
	return p;
}

/** 駅の配列/Set を「駅ID の Set」にする。Set はそのまま使う（呼び出し側が ID の Set を渡す前提） */
function toIdSet(list) {
	if (!list) return EMPTY_SET;
	if (list instanceof Set) return list;
	if (list.length === 0) return EMPTY_SET;
	const set = new Set();
	for (const item of list) {
		const v = id(item);
		if (v) set.add(v);
	}
	return set;
}

const dias = new Map();
function readOud(json) {
	return memoAsync(dias, json, () => readDia(json));
}

// ============================================================
// 駅間ごとの列車インデックス
//   (出発駅, 到着駅) ごとに「その区間を走る全列車」を一度だけ組み立て、
//   以降は二分探索 + 訪問済みフィルタだけで検索する。
// ============================================================

const pairIndexCache = new Map();
const throughContextCache = new Map();

function makeEntry(train, dia, arr, dep, terminalName, passing) {
	const type = typeName(train, dia);
	const passingIds = [];
	for (const station of passing) {
		const v = id(station);
		if (v) passingIds.push(v);
	}
	return {
		dep,
		arr,
		number: train.number,
		paid: type === '特急' || type === 'ライナー',
		passingIds,
		info: { train, type, terminal: terminalName, passing },
	};
}

function finalizeIndex(entries) {
	let minGap = 0; // arr - dep の最小値（負になるデータがあっても枝刈りが壊れないように）
	for (const e of entries) minGap = Math.min(minGap, e.arr - e.dep);
	return {
		byDep: [...entries].sort((a, b) => a.dep - b.dep),
		byArr: [...entries].sort((a, b) => a.arr - b.arr),
		minGap,
	};
}

async function buildSameLineIndex(fromsta, tosta) {
	const dia = await readOud(nodes[fromsta].json);

	const innerstations = dia.railway.stations.map((sta) => sta.name);
	const last = innerstations.length - 1;

	let direction = 0;
	let from = innerstations.includes(fromsta) ? innerstations.indexOf(fromsta) : innerstations.indexOf(fromsta.slice(0, 4));
	let to = innerstations.includes(tosta) ? innerstations.indexOf(tosta) : innerstations.indexOf(tosta.slice(0, 4));
	if (from > to) {
		direction = 1;
		from = last - from;
		to = last - to;
	}

	const trains = dia.railway.diagrams[0].trains[direction] ?? [];
	const entries = [];
	for (const train of trains) {
		if (!train) continue;
		const data = train.timetable._data;
		if (data[from]?.stopType !== 1 || data[to]?.stopType !== 1) continue;

		const arr = adjustTime(data[to].arrival ?? data[to].departure);
		const dep = adjustTime(data[from].departure ?? data[from].arrival);

		const passing = [];
		data.forEach((sta, i) => {
			if (!sta) return;
			if (!(from < i && i < to)) return;
			passing.push(train.direction === 0 ? innerstations[i] : innerstations[last - i]);
		});

		entries.push(makeEntry(train, dia, arr, dep, terminal(train, dia), passing));
	}
	return finalizeIndex(entries);
}

/** 直通運転（路線をまたぐ列車）用の前処理。(from路線, to路線) ごとに一度だけ */
function getThroughContext(fromJson, toJson) {
	return memoAsync(throughContextCache, `${fromJson}|${toJson}`, async () => {
		const [fromDia, toDia] = await Promise.all([readOud(fromJson), readOud(toJson)]);

		const fromStations = fromDia.railway.stations.map((sta) => sta.name);
		const toStations = toDia.railway.stations.map((sta) => sta.name);
		const fromTrains = (fromDia.railway.diagrams[0].trains.flat() ?? []).filter(Boolean);

		const toTrainsByNumber = new Map();
		for (const train of toDia.railway.diagrams[0].trains.flat() ?? []) {
			if (!train?.number) continue;
			const list = toTrainsByNumber.get(train.number) ?? [];
			list.push(train);
			toTrainsByNumber.set(train.number, list);
		}
		return { fromDia, toDia, fromStations, toStations, fromTrains, toTrainsByNumber };
	});
}

async function buildThroughIndex(fromsta, tosta) {
	const { fromDia, toDia, fromStations, toStations, fromTrains, toTrainsByNumber } = await getThroughContext(
		nodes[fromsta].json,
		nodes[tosta].json,
	);

	const f = fromStations.includes(fromsta) ? fromStations.indexOf(fromsta) : fromStations.indexOf(fromsta.slice(0, 4));
	const t = toStations.includes(tosta) ? toStations.indexOf(tosta) : toStations.indexOf(tosta.slice(0, 4));

	const entries = [];
	for (const fromTrain of fromTrains) {
		const from = fromTrain.direction === 0 ? f : fromStations.length - 1 - f;
		const fromData = fromTrain.timetable._data;
		if (fromData[from] == null || fromTrain.number == '' || !toTrainsByNumber.has(fromTrain.number)) continue;

		const toTrain = toTrainsByNumber.get(fromTrain.number)[0];
		const to = toTrain.direction === 0 ? t : toStations.length - 1 - t;
		const toData = toTrain.timetable._data;
		if (fromData[from].stopType !== 1 || toData[to]?.stopType !== 1) continue;

		const arr = adjustTime(toData[to].arrival ?? toData[to].departure);
		const dep = adjustTime(fromData[from].departure ?? fromData[from].arrival);
		if (dep >= arr) continue;

		const passing = [];
		fromData.forEach((sta, i) => {
			if (sta && from < i) {
				passing.push(fromTrain.direction === 0 ? fromStations[i] : fromStations[fromStations.length - 1 - i]);
			}
		});
		toData.forEach((sta, i) => {
			if (sta && i < to) {
				passing.push(toTrain.direction === 0 ? toStations[i] : toStations[toStations.length - 1 - i]);
			}
		});

		entries.push(makeEntry(fromTrain, fromDia, arr, dep, terminal(toTrain, toDia), passing));
	}
	return finalizeIndex(entries);
}

function getPairIndex(fromsta, tosta) {
	return memoAsync(pairIndexCache, `${fromsta}|${tosta}`, () =>
		nodes[fromsta].json === nodes[tosta].json ? buildSameLineIndex(fromsta, tosta) : buildThroughIndex(fromsta, tosta),
	);
}

// ============================================================
// 検索（二分探索 + 上位 limit 件の保持）
// ============================================================

/** value > x となる最初の位置 */
function firstGreater(list, key, x) {
	let lo = 0;
	let hi = list.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (list[mid][key] > x) hi = mid;
		else lo = mid + 1;
	}
	return lo;
}

/** value >= x となる最初の位置 */
function firstNotLess(list, key, x) {
	let lo = 0;
	let hi = list.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (list[mid][key] >= x) hi = mid;
		else lo = mid + 1;
	}
	return lo;
}

/** out（cmp 昇順）に item を入れる。limit 件を超えたら最悪のものを捨てる */
function insertTop(out, item, limit, cmp) {
	let i = out.length;
	if (i >= limit) {
		if (cmp(item, out[i - 1]) >= 0) return;
		out.pop();
		i--;
	}
	while (i > 0 && cmp(item, out[i - 1]) < 0) i--;
	out.splice(i, 0, item);
}

function hasConflict(ids, visitedSet, allowedSet) {
	if (visitedSet.size === 0) return false;
	for (const s of ids) {
		if (visitedSet.has(s) && !allowedSet.has(s)) return true;
	}
	return false;
}

function pickBest(index, nowsecond, mode, tokkyu, visitedSet, allowedSet, limit, trainNumber) {
	const { byDep, byArr, minGap } = index;
	const out = [];
	const cmp = mode === 0 ? (a, b) => a.arr - b.arr || a.dep - b.dep : (a, b) => b.dep - a.dep || b.arr - a.arr;
	const usable = (e) =>
		(trainNumber === undefined || e.number === trainNumber) && (tokkyu || !e.paid) && !hasConflict(e.passingIds, visitedSet, allowedSet);

	// 当日 → 翌日(mode=0) / 前日(mode=1) の順に探し、見つかった時点で終了
	for (let step = 0; step < 2 && out.length === 0; step++) {
		const off = (mode === 0 ? step : -step) * DAY;

		if (mode === 0) {
			for (let i = firstGreater(byDep, 'dep', nowsecond - off); i < byDep.length; i++) {
				const e = byDep[i];
				// これ以降の列車は到着が worst より遅い → 打ち切り
				if (out.length >= limit && e.dep + off + minGap > out[out.length - 1].arr) break;
				if (!usable(e)) continue;
				insertTop(out, { e, arr: e.arr + off, dep: e.dep + off }, limit, cmp);
			}
		} else {
			for (let i = firstNotLess(byArr, 'arr', nowsecond - off) - 1; i >= 0; i--) {
				const e = byArr[i];
				if (out.length >= limit && e.arr + off - minGap < out[out.length - 1].dep) break;
				if (!usable(e)) continue;
				insertTop(out, { e, arr: e.arr + off, dep: e.dep + off }, limit, cmp);
			}
		}
	}
	return out.map(({ e, arr, dep }) => ({ ...e.info, arr, dep }));
}

/**
 * 特定の駅間の最速の列車を探す
 * @param {Number} nowtime 出発時刻（mode=0）または到着時刻（mode=1）
 * @param {String} fromsta 出発駅（ナンバリング）
 * @param {String} tosta 到着駅（ナンバリング）
 * @param {Number} mode 出発時刻から検索(0) or 到着時刻から検索(1)
 * @param {Boolean} tokkyu 有料列車（特急 or ライナー）を許可するかどうか
 * @param {Set<String>|Array<String>} visited 既に経由した駅ID（Set 推奨）
 * @param {Array<String>} allowedRepeatStations 再通過を許す駅
 * @param {Number} limit 返す最大件数（上位 limit 件を正確に返す）。省略時は全件
 * @param {String} [trainNumber] 指定すると、その列車番号の列車だけを対象にする（同一列車の継続検索用）
 * @returns {Array<{train: Object, arr: Number, dep: Number, type: String, terminal: String, passing: Array<String>}>}
 *   mode=0 は到着の早い順、mode=1 は出発の遅い順
 */
export async function searchFastestTrain(nowtime, fromsta, tosta, mode, tokkyu, visited, allowedRepeatStations = [], limit = Infinity, trainNumber = undefined) {
	const nowsecond = adjustTime(nowtime);
	const index = await getPairIndex(fromsta, tosta);
	return pickBest(index, nowsecond, mode, tokkyu, toIdSet(visited), toIdSet(allowedRepeatStations), Math.max(1, limit), trainNumber);
}

// ============================================================
// 同じ列車で行ける駅
// ============================================================

const stopsCache = new WeakMap(); // train -> Map<json, Promise<{stops, indexById}>>

function getStops(json, train) {
	let perJson = stopsCache.get(train);
	if (!perJson) {
		perJson = new Map();
		stopsCache.set(train, perJson);
	}
	return memoAsync(perJson, json, () =>
		Promise.resolve(formatStops(json, train)).then((stops) => {
			const indexById = new Map();
			stops.forEach((sta, i) => {
				const list = indexById.get(sta.id);
				if (list) list.push(i);
				else indexById.set(sta.id, [i]);
			});
			return { stops, indexById };
		}),
	);
}

/**
 * 同じ列車で行ける駅の到着、出発時刻を探す
 * @param {string} station 出発駅
 * @param {number} time 時刻
 * @param {Object} train 乗車列車
 * @param {Set<string>|Array<string>} passing 既に経由した駅ID（Set 推奨）
 * @param {0|1} mode mode
 * @param {Array<string>} allowedRepeatStations 再通過を許す駅
 * @returns {Array<{to: string, arr: number, dep: number, trail: Array<string>, trailLen: number, viaRosen: Array<string>}>}
 *   trail の先頭 trailLen 個が「その駅に着くまでに通過した駅」（passing は含まない）。
 *   同じ列車・同じ起点の結果は trail 配列を共有する（trailLen が増えていく）。
 */
export async function searchOtherStops(station, time, train, passing, mode, allowedRepeatStations = []) {
	const { stops, indexById } = await getStops(nodes[station].json, train);

	const froms = indexById.get(id(station));
	if (!froms) return [];

	const step = mode === 0 ? 1 : -1;
	const passingSet = toIdSet(passing);
	const allowedSet = toIdSet(allowedRepeatStations);

	const result = [];
	for (const from of froms) {
		const trail = [];
		const viaRosen = [];
		for (let i = from + step; i >= 0 && i < stops.length; i += step) {
			const stop = stops[i];
			const stopId = id(stop.id);
			if (passingSet.has(stopId) && !allowedSet.has(stopId)) break;

			trail.push(stop.id);
			const lineName = stop.lineName;
			if (!viaRosen.includes(lineName)) viaRosen.push(lineName);

			if (stop.stopType !== 'stop') continue;
			if (mode === 0 && stop.arr === null) continue;
			if (mode === 1 && stop.dep === null) continue;

			const arr = stop.arr + Number((mode === 0 && time > stop.arr) || (mode === 1 && time < stop.arr)) * DAY;
			const dep = stop.dep + Number((mode === 0 && time > stop.dep) || (mode === 1 && time < stop.dep)) * DAY;
			result.push({
				to: stop.id,
				arr,
				dep,
				trail,
				trailLen: trail.length,
				viaRosen: [...viaRosen],
			});
		}
	}
	return result;
}
