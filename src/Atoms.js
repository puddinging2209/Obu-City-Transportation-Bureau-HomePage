import { atom } from 'jotai';

export const myStations = atom(
    localStorage.getItem('myStations')?.match(/\[\{.*\}.*\]/) ? JSON.parse(localStorage.getItem('myStations')) : [{ name: '大府', role: 'station' }]
);