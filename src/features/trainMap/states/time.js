import { atom } from 'jotai'
import { mod } from '../../../utils/mod'

function getNowSecond() {
	const date = new Date()
	return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + 0.001 * date.getMilliseconds()
}

export const timeAtom = atom({
	startAt: performance.now(),
	baseSimulationTime: getNowSecond(),
	speedRate: 1,
	paused: false
})

export const simulationTimeGetterAtom = atom((get) => () => {
	const timeState = get(timeAtom)
	const actualSpeedRate = timeState.paused ? 0 : timeState.speedRate
	return mod(timeState.baseSimulationTime + ((performance.now() - timeState.startAt) * actualSpeedRate) / 1000, 60 * 60 * 24)
})

export const syncRealTimeAtom = atom(null, (get, set) => {
	set(timeAtom, {
		startAt: performance.now(),
		baseSimulationTime: getNowSecond(),
		speedRate: 1,
		paused: false
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

export const setPausedAtom = atom(null, (get, set, paused) => {
	const state = get(timeAtom)
	set(timeAtom, {
		...state,
		startAt: performance.now(),
		baseSimulationTime: get(simulationTimeGetterAtom)(),
		paused
	})
})

export const setSpeedAtom = atom(null, (get, set, speed) => {
	const state = get(timeAtom)
	set(timeAtom, {
		startAt: performance.now(),
		baseSimulationTime: get(simulationTimeGetterAtom)(),
		speedRate: speed,
		paused: state.paused
	})
})
