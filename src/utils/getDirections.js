import linesData from '../data/lines.json';
import stationsData from '../data/stations.json';

export default function getDirections(station) {
	const lines = stationsData[station].routes;
	return lines
		.map((line) => {
			const candidates = [linesData[line][0].id, linesData[line].at(-1).id];
			return candidates.filter((id) => id !== station).map((id) => ({ line, id }));
		})
		.flat();
}
