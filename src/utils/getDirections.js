import linesData from '../data/lines.json';
import nodes from '../data/nodes.json';

export default function getDirections(station) {
	if (!station) return [];
	const lines = Array.from(
		new Set(
			Object.values(nodes)
				.filter((n) => n.id === station)
				.map((n) => n.line)
				.filter((l) => l !== '徒歩経路'),
		),
	);
	const result = lines
		.map((line) => {
			const index = linesData[line].stations.findIndex((s) => station === s.id);
			if (index === -1) return [];
			if (!linesData[line].isLoop)
				return [-1, 1].map((d) => {
					for (let i = index + d; i >= 0 && i < linesData[line].stations.length; i += d) {
						const s = linesData[line].stations[i];
						if (s.isMajor || s.types['com-exp'] || i === 0 || i === linesData[line].stations.length - 1) return { line, id: s.id };
					}
				});
			else
				return [1, -1].map((d) => {
					let i = index;
					while (true) {
						i += d + linesData[line].stations.length;
						i %= linesData[line].stations.length;
						const s = linesData[line].stations[i];
						if (s.isMajor || s.types['com-exp']) return { line, id: s.id };
					}
				});
		})
		.flat()
		.filter((d) => d && d !== station);

	if (station === 'hnt') result.push({ line: '刈田川急行線', id: 'obu' });
	if (station === 'sos') result.push({ line: '刈田川急行線', id: 'obu' });

	return result;
}
