import linesData from '../data/lines.json';
import titlesData from '../data/titles.json';
import { getLocalGovByCode } from './govId.js';

export default async function getTitles(classified = false) {
	const titleIds = JSON.parse(window.localStorage.getItem('titles') ?? '[]');
	const titles = {};
	for (const id of titleIds) {
		if (typeof id !== 'string') continue;
		const title = await getTitle(id);
		if (!title) continue;
		if (id.startsWith('0')) {
			titles.all ??= [];
			titles.all.push(title);
			continue;
		}
		if (id.startsWith('1')) {
			titles.eachLine ??= [];
			titles.eachLine.push(title);
			continue;
		}
		if (id.startsWith('2')) {
			titles.eachPrefecture ??= [];
			titles.eachPrefecture.push(title);
			continue;
		}
		if (id.startsWith('3')) {
			titles.eachCity ??= [];
			titles.eachCity.push(title);
			continue;
		}
	}

	if (classified) return titles;
	console.log(titles);
	return Object.values(titles).flat();
}

export async function getTitle(id) {
	if (!id) return;
	if (id.startsWith('0')) {
		return titlesData.all.ratio.find((t) => t.id === id)?.title;
	}
	if (id.startsWith('1')) {
		const titleId = id.slice(0, 4);
		const lineId = id.slice(4);
		return titlesData.eachLine.ratio.find((t) => t.id === titleId)?.title?.replace('_LINE_', linesData[lineId].name);
	}
	if (id.startsWith('2')) {
		const titleId = id.slice(0, 4);
		const prefectureId = id.slice(4);
		const prefecture = await getLocalGovByCode(prefectureId);
		return titlesData.eachPrefecture.ratio.find((t) => t.id === titleId)?.title?.replace('_PREFECTURE_', prefecture?.name ?? '');
	}
	if (id.startsWith('3')) {
		const titleId = id.slice(0, 4);
		const govId = id.slice(4);
		const municipality = await getLocalGovByCode(govId);
		return titlesData.eachCity.ratio.find((t) => t.id === titleId)?.title?.replace('_CITY_', municipality?.name ?? '');
	}
}
