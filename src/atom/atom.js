import { atom } from 'jotai';

import { id } from '../utils/Station.js';

const isLegacyTitleId = (titleId) => /^2\d{3}[a-z]{2}$/i.test(titleId) || /^3\d{3}[a-z]{4}$/i.test(titleId);
const savedTitles = JSON.parse(localStorage.getItem('titles') ?? '[]');
const currentTitles = savedTitles.filter((titleId) => !isLegacyTitleId(titleId));

if (currentTitles.length !== savedTitles.length) {
	localStorage.setItem('titles', JSON.stringify(currentTitles));
}

if (isLegacyTitleId(localStorage.getItem('title'))) {
	localStorage.removeItem('title');
}

export const settingsAtom = atom(
	{
		general: {
			theme: 'light',
			changeTypeColorInDarkToLight: false,
			showSeconds: false,
		},
		map: {
			updateInterval: 0,
		},
		...(localStorage.getItem('settings') ?
			localStorage.getItem('settings')?.includes('general') ?
				JSON.parse(localStorage.getItem('settings'))
			:	{
					general: JSON.parse(localStorage.getItem('settings')),
				}
		:	{}),
	},
	(get, set, settings) => {
		localStorage.setItem('settings', JSON.stringify(settings));
		set(settingsAtom, settings);
	},
);

export const myStationsAtom = atom(
	localStorage.getItem('myStations') ?
		JSON.parse(localStorage.getItem('myStations')).map((v) => (typeof v === 'string' ? v : v.id || id(v.name)))
	:	['obu'],
);

export const addMyStationAtom = atom(null, (get, set, s) => {
	const prev = get(myStationsAtom);
	const after = [...prev, s];

	set(myStationsAtom, after);
	localStorage.setItem('myStations', JSON.stringify(after));
});

export const nearestStationAtom = atom(null);

export const isOpenDrawerAtom = atom(false);

export const resultAtom = atom([]);

export const titlesAtom = atom(currentTitles);

export const addTitleAtom = atom(null, (get, set, title) => {
	const prev = get(titlesAtom);
	if (prev.includes(title)) return;
	const after = [...prev, title];

	set(titlesAtom, after);
	localStorage.setItem('titles', JSON.stringify(after));
});
