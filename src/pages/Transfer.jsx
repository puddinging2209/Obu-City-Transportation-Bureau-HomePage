import React from 'react';

import { useAtom } from 'jotai';

import TransferInput from '../components/TransferInput.jsx';
import TransferOutput from '../components/TransferOutput.jsx';

import { resultAtom } from '../utils/Atom.js';
import { dijkstra } from '../utils/findRoute.js';
import getFare from '../utils/getFare.js';
import { adjustTime, toTime } from '../utils/Time.js';

function Transfer() {
	const [result, setResult] = useAtom(resultAtom);
	const [loading, setLoading] = React.useState(false);

	const searchTransfer = async (
		from,
		to,
		baseTime,
		mode,
		{ transferTime, tokkyu, allowOuterTransfer, viaStations, enableViaStations, heuristicMode },
	) => {
		if (!from || !to) return;
		setLoading(true);
		let segments = [];
		console.log(heuristicMode);
		try {
			if (!enableViaStations || viaStations.length === 0) {
				segments = [await dijkstra(from, to, adjustTime(baseTime), mode, transferTime - 1, tokkyu, heuristicMode, allowOuterTransfer)];
			} else {
				const stations = [from, ...viaStations.map((s) => s.value.value), to];
				let time = baseTime;
				for (let i = 0; i < stations.length - 1; i++) {
					const segment = await dijkstra(
						stations[i],
						stations[i + 1],
						adjustTime(time),
						mode,
						transferTime - 1,
						tokkyu,
						heuristicMode,
						allowOuterTransfer,
					);
					time = segment.segments.at(-1).arrTime + viaStations[i]?.options?.stayingTime * 60 ?? 0;
					if (i > 0 && !viaStations[i - 1]?.options?.exitGate) {
						const beforeVisited = segments.at(-1).header.visited;
						const lastVisited = segment.header.visited;

						const s = new Set(beforeVisited);
						if (!lastVisited.some((station) => station !== segment.header.from && s.has(station))) {
							const newSegment = {
								...segments.at(-1),
								segments: [...segments.at(-1).segments, ...segment.segments],
								header: {
									...segments.at(-1).header,
									to: segment.header.to,
									distance: segments.at(-1).header.distance + segment.header.distance,
									fare: getFare(segments.at(-1).header.distance + segment.header.distance),
									requiredTime: toTime(segment.segments.at(-1).arrTime - segments.at(-1).segments[0].depTime),
									visited: Array.from(new Set([...beforeVisited, ...lastVisited])),
								},
							};
							segments.pop();
							segments.push(newSegment);
						} else segments.push(segment);
					} else segments.push(segment);
				}
			}
			setResult(segments);
			console.log(segments);
			const lastSearch = JSON.parse(sessionStorage.getItem('lastSearch'));
			sessionStorage.setItem(
				'lastSearch',
				JSON.stringify({
					...lastSearch,
					result: segments,
				}),
			);
		} catch (error) {
			alert(`エラーが発生しました: ${error.message}`);
			console.error(error);
			setResult([]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<TransferInput loading={loading} onSearch={searchTransfer} />
			{result?.map((result, index) => (
				<TransferOutput key={index} result={result} />
			))}
		</>
	);
}

export default Transfer;
