import { atom } from 'jotai'
import { mod } from '../../../utils/mod'

function getNowSecond() {
	const date = new Date()
	return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + 0.001 * date.getMilliseconds()
}

export const timeAtom = atom({
	startAt: performance.now(),
	baseSimulationTime: getNowSecond(),
	speedRate: 1
})

export const simulationTimeGetterAtom = atom((get) => () => {
	const timeState = get(timeAtom)
	return mod(timeState.baseSimulationTime + ((performance.now() - timeState.startAt) * timeState.speedRate) / 1000, 60 * 60 * 24)
})

export const syncRealTimeAtom = atom(null, (get, set) => {
	set(timeAtom, {
		startAt: performance.now(),
		baseSimulationTime: getNowSecond(),
		speedRate: 1
	})
})

export const setSecondAtom = atom(null, (get, set, second) => {
	const state = get(timeAtom)
	set(timeAtom, {
		...state,
		startAt: performance.now(),
		baseSimulationTime: second,
	})
})

export const setSpeedAtom = atom(null, (get, set, speed) => {
	const state = get(timeAtom)
	set(timeAtom, {
		startAt: performance.now(),
		baseSimulationTime: state.baseSimulationTime + (performance.now() - state.startAt) * state.speedRate / 1000,
		speedRate: speed
	})
})
