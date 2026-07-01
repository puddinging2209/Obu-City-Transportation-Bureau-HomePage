import { atom } from 'jotai';

import { id } from './Station.js';

export const myStationsAtom = atom(
    localStorage.getItem('myStations')?.match(/\[\{.*\}.*\]/) ?
        JSON.parse(localStorage.getItem('myStations')).map((v) => ({
            id: v.id ?? id(v.name),
            role: v.role,
        }))
    :   [{ id: 'obu', role: 'station' }],
);

export const addMyStationAtom = atom(null, (get, set, { id, role }) => {
    const prev = get(myStationsAtom);
    const after = [...prev, { id, role }];

    set(myStationsAtom, after);
    localStorage.setItem('myStations', JSON.stringify(after));
});

export const nearestStationAtom = atom(null);

export const isOpenDrawerAtom = atom(false);
