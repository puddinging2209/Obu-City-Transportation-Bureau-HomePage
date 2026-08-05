import { id } from './Station.js';
import { toTime } from './Time.js';
export default function reconstructByState(goalStateId, previous, used, mode, header) {
	const states = [];
	let cur = goalStateId;

	while (cur) {
		states.unshift(cur);
		cur = previous[cur];
	}

	return formatRouteFromStates(mode === 0 ? states : states.reverse(), used, mode, header);
}

function formatRouteFromStates(states, used, mode, header) {
	const segments = [];

	let current = {
		train: null,
		detail: { terminal: null, typeName: null, viaRosen: null },
	};
	let fromSta = null;
	let depTime = null;
	let lastArrTime = null;
	let lastTo = null;

	for (let i = 0; i < states.length; i++) {
		const curUsed = used[states[i]];
		if (!curUsed || !curUsed.train) continue;

		// --- segment 開始 ---
		if (current.train === null) {
			current = {
				train: curUsed.train,
				detail: {
					terminal: curUsed.terminal,
					typeName: curUsed.type,
					viaRosen: mode === 0 ? curUsed.viaRosen : curUsed.viaRosen.toReversed(),
					meter: curUsed.meter,
				},
			};
			fromSta = mode === 0 ? curUsed.from : curUsed.to;
			depTime = curUsed.dep;
		}

		// --- 列車が変わったら segment 確定 ---
		if (curUsed.train !== current.train) {
			segments.push({
				train: current.train,
				from: id(fromSta),
				to: id(lastTo),
				depTime: depTime,
				arrTime: lastArrTime,
				terminal: current.detail.terminal,
				typeName: current.detail.typeName,
				line: current.detail.viaRosen,
				meter: current.detail.meter,
			});

			// 新しい列車
			current = {
				train: curUsed.train,
				detail: {
					terminal: curUsed.terminal,
					typeName: curUsed.type,
					viaRosen: mode === 0 ? curUsed.viaRosen : curUsed.viaRosen.toReversed(),
					meter: curUsed.meter,
				},
			};
			fromSta = mode === 0 ? curUsed.from : curUsed.to;
			depTime = curUsed.dep;
		}

		// 毎回更新（重要）
		lastArrTime = curUsed.arr;
		lastTo = mode === 0 ? curUsed.to : curUsed.from;
	}

	// --- 最後の segment を必ず確定 ---
	if (current.train !== null) {
		segments.push({
			train: current.train,
			from: id(fromSta),
			to: id(lastTo),
			depTime: depTime,
			arrTime: lastArrTime,
			terminal: current.detail.terminal,
			typeName: current.detail.typeName,
			line: current.detail.viaRosen,
			meter: current.detail.meter,
		});
	}

	header.requiredTime = toTime(segments.at(-1).arrTime - segments[0].depTime);

	return { header, segments };
}
