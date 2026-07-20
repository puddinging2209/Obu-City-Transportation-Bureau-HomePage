import linesData from '../data/lines.json';
import stationsData from '../data/stations.json';

export default function getDirections(station) {
	const lines = stationsData[station].routes;
	return lines
		.map((line) => {
			const index = linesData[line].stations.findIndex((s) => station === s.id);
			return [-1, 1].map((d) => {
				for (let i = index + d; i >= 0 && i < linesData[line].stations.length; i += d) {
					const s = linesData[line].stations[i];
					if (s.types['com-exp'] || i === 0 || i === linesData[line].stations.length - 1) return { line, id: s.id };
				}
			});
		})
		.flat()
		.filter((d) => d);
}
