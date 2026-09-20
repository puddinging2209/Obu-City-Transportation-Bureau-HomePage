import lines from '../data/lines.json';
import stationsData from '../data/stations.json';
import titlesData from '../data/titles.json';

const prefectures = [...new Set(Object.values(stationsData).map((s) => s.prefecture))];
const cities = [...new Set(Object.values(stationsData).map((s) => [s.prefecture, s.city]))];

export default function giveTitle(visiteds) {
	const titles = JSON.parse(window.localStorage.getItem('titles') ?? '[]');
	const visitedIds = [...new Set(visiteds.map((v) => v.id))];

	// 全駅
	const ratioOfAll = visitedIds.length / Object.keys(stationsData).length;
	if (ratioOfAll === 0) return;
	titlesData.all.ratio.forEach((t) => {
		if (ratioOfAll >= t.ratio && !titles.includes(t.id)) {
			titles.push(t.id);
		}
	});

	// 各路線
	Object.values(lines).forEach(({ id: lineId, stations }) => {
		const ratio = visitedIds.filter((id) => stations.some((s) => s.id === id)).length / stations.length;
		if (ratio === 0) return;
		titlesData.eachLine.ratio.forEach((t) => {
			const id = t.id + lineId;
			if (ratio >= t.ratio && !titles.includes(id)) {
				titles.push(id);
			}
		});
	});

	// 各県
	prefectures.forEach((prefecture) => {
		const ratio =
			visitedIds.filter((v) => stationsData[v].prefecture === prefecture).length /
			Object.values(stationsData).filter((s) => s.prefecture === prefecture).length;
		if (ratio === 0) return;
		titlesData.eachPrefecture.ratio.forEach((t) => {
			const id = t.id + prefecture;
			if (ratio >= t.ratio && !titles.includes(id)) {
				titles.push(id);
			}
		});
	});

	// 各市町
	cities.forEach((city) => {
		const ratio =
			visitedIds.filter((v) => stationsData[v].prefecture === city[0] && stationsData[v].city === city[1]).length /
			Object.values(stationsData).filter((s) => s.prefecture === city[0] && s.city === city[1]).length;
		if (ratio === 0) return;
		titlesData.eachCity.ratio.forEach((t) => {
			const id = t.id + city.join('');
			if (ratio >= t.ratio && !titles.includes(id)) {
				titles.push(id);
			}
		});
	});

	window.localStorage.setItem('titles', JSON.stringify(titles.sort()));
	if (!window.localStorage.getItem('title')) window.localStorage.setItem('title', titles[0]);
}
