import lines from '../data/lines.json';
import stationsData from '../data/stations.json';
import titles from '../data/titles.json';

const prefectures = [...new Set(Object.values(stationsData).map((s) => s.prefecture))];
const cities = [...new Set(Object.values(stationsData).map((s) => s.city))];

export default function giveTitle(visiteds) {
	const hasTitiles = JSON.stringify(window.localStorage.getItem('titles') ?? '[]');
	const visitedIds = [...new Set(visiteds.map((v) => v.id))];
	console.log('visitedIds', visitedIds);

	// 全駅
	const ratioOfAll = visitedIds.length / Object.keys(stationsData).length;
	if (ratioOfAll === 0) return;
	titles.all.ratio.forEach((t) => {
		if (ratioOfAll >= t.ratio && !hasTitiles.includes(t.id)) {
			window.localStorage.setItem('titles', JSON.stringify([...hasTitiles, t.id]));
		}
	});

	// 各路線
	Object.values(lines).forEach(({ name: lineName, stations }) => {
		const ratio = visitedIds.filter((id) => stations.some((s) => s.id === id)).length / stations.length;
		if (ratio === 0) return;
		titles.eachLine.ratio.forEach((t) => {
			const id = lineName + t.id;
			if (ratio >= t.ratio && !hasTitiles.includes(id)) {
				window.localStorage.setItem('titles', JSON.stringify([...hasTitiles, id]));
			}
		});
	});

	// 各県
	prefectures.forEach((prefecture) => {
		const ratio =
			visitedIds.filter((v) => stationsData[v].prefecture === prefecture).length /
			Object.values(stationsData).filter((s) => s.prefecture === prefecture).length;
		console.log('prefecture', prefecture, ratio);
		if (ratio === 0) return;
		titles.eachPrefecture.ratio.forEach((t) => {
			const id = prefecture + t.id;
			if (ratio >= t.ratio && !hasTitiles.includes(id)) {
				window.localStorage.setItem('titles', JSON.stringify([...hasTitiles, id]));
			}
		});
	});

	// 各市町
	cities.forEach((city) => {
		const ratio =
			visitedIds.filter((v) => stationsData[v].city === city).length / Object.values(stationsData).filter((s) => s.city === city).length;
		if (ratio === 0) return;
		titles.eachCity.ratio.forEach((t) => {
			const id = city + t.id;
			if (ratio >= t.ratio && !hasTitiles.includes(id)) {
				window.localStorage.setItem('titles', JSON.stringify([...hasTitiles, id]));
			}
		});
	});
}
