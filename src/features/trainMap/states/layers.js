import { atom } from 'jotai'
import { initializeLinesLayer } from '../layers/lines'
import { initializeStationsLayer } from '../layers/stations'
import { initializeTrainsLayer } from '../layers/trains'

export const layers = [
	initializeLinesLayer,
	initializeStationsLayer,
	initializeTrainsLayer
]

export const layersEnabledAtom = atom([])
