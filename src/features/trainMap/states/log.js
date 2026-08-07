import { atom } from 'jotai';

export const stationLogAtom = atom(localStorage.getItem('visitedStations') === null ?
	[] :
	JSON.parse(localStorage.getItem('visitedStations'))
)

export const addToStationLogAtom = atom(null, (get, set, id) => {
	const visited = get(stationLogAtom)
	const updated = [];
	for (const i in visited) {
		const v = visited[i];
		if (visited[i - 1]?.id === v.id) continue;
		updated.push(v);
	}
	if (visited.at(-1)?.id === id) return false
	const newValue = [...updated.toSorted((v1, v2) => v1.time - v2.time), { id, time: Date.now() }]
	set(stationLogAtom, newValue)
	localStorage.setItem('visitedStations', JSON.stringify(newValue))
	return true
})
