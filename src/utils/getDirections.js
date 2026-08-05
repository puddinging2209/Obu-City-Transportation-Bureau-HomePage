import linesData from '../data/lines.json';
import nodes from '../data/nodes.json';

export default function getDirections(station) {
	if (!station) return [];
	const lines = Object.values(nodes)
		.filter((n) => n.id === station)
		.map((n) => n.line)
		.filter((l) => l !== '徒歩経路');
	return lines
		.map((line) => {
			const index = linesData[line].stations.findIndex((s) => station === s.id);
			if (index === -1) return [];
			if (!linesData[line].isLoop || !(index === 0 || index === linesData[line].stations.length - 1))
				return [-1, 1].map((d) => {
					for (let i = index + d; i >= 0 && i < linesData[line].stations.length; i += d) {
						const s = linesData[line].stations[i];
						if (s.isMajor || s.types['com-exp'] || i === 0 || i === linesData[line].stations.length - 1) return { line, id: s.id };
					}
				});
			else
				return [
					{ d: 1, index: 0 },
					{ d: -1, index: linesData[line].stations.length - 1 },
				].map((s) => {
					for (let i = s.index + s.d; i >= 0 && i < linesData[line].stations.length; i += s.d) {
						const s = linesData[line].stations[i];
						if (s.isMajor || s.types['com-exp'] || i === 0 || i === linesData[line].stations.length - 1) return { line, id: s.id };
					}
				});
		})
		.flat()
		.filter((d) => d);
}
