import { atom } from 'jotai';

import { id } from './Station.js';

export const settingsAtom = atom(
	{
		theme: 'light',
		showSeconds: false,
		...JSON.parse(localStorage.getItem('settings')),
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
