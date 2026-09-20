import linesData from '../data/lines.json';
import locations from '../data/locations.json';
import titlesData from '../data/titles.json';

export default function getTitles(classified = false) {
	const titleIds = JSON.parse(window.localStorage.getItem('titles') ?? '[]');
	const titles = {};
	titleIds.forEach((id) => {
		if (typeof id !== 'string') return;
		const title = getTitle(id);
		if (!title) return;
		if (id.startsWith('0')) {
			titles.all ??= [];
			titles.all.push(title);
			return;
		}
		if (id.startsWith('1')) {
			titles.eachLine ??= [];
			titles.eachLine.push(title);
			return;
		}
		if (id.startsWith('2')) {
			titles.eachPrefecture ??= [];
			titles.eachPrefecture.push(title);
			return;
		}
		if (id.startsWith('3')) {
			titles.eachCity ??= [];
			titles.eachCity.push(title);
			return;
		}
	});

	if (classified) return titles;
	console.log(titles);
	return Object.values(titles).flat();
}

export function getTitle(id) {
	if (!id) return;
	if (id.startsWith('0')) {
		return titlesData.all.ratio.find((t) => t.id === id)?.title;
	}
	if (id.startsWith('1')) {
		const titleId = id.slice(0, 4);
		const lineId = id.slice(4);
		console.log(titleId, lineId);
		return titlesData.eachLine.ratio.find((t) => t.id === titleId)?.title?.replace('_LINE_', linesData[lineId].name);
	}
	if (id.startsWith('2')) {
		const titleId = id.slice(0, 4);
		const prefectureId = id.slice(4);
		return titlesData.eachPrefecture.ratio.find((t) => t.id === titleId)?.title?.replace('_PREFECTURE_', locations.prefectures[prefectureId]);
	}
	if (id.startsWith('3')) {
		const titleId = id.slice(0, 4);
		const prefectureId = id.slice(4, 6);
		const cityId = id.slice(6);
		return titlesData.eachCity.ratio.find((t) => t.id === titleId)?.title?.replace('_CITY_', locations.cities[prefectureId][cityId]);
	}
}
