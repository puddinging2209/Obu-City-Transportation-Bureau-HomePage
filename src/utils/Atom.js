import { atom } from 'jotai';

export const myStationsAtom = atom(
    localStorage.getItem('myStations')?.match(/\[\{.*\}.*\]/) ? JSON.parse(localStorage.getItem('myStations')) : [{ name: '大府', role: 'station' }]
);

export const addMyStationAtom = atom(
    null,
    (get, set, { name, role }) => {
        const prev = get(myStationsAtom);
        const after = [...prev, { name, role }];

        set(myStationsAtom, after);
        localStorage.setItem('myStations', JSON.stringify(after));
    }
);