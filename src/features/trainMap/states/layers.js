import { atom } from 'jotai'
import { initializeLinesLayer } from '../layers/lines'
import { initializeObuLayer } from '../layers/obu'
import { initializeStationsLayer } from '../layers/stations'
import { initializeTrainsLayer } from '../layers/trains'

export const layers = [
	initializeTrainsLayer,
	initializeStationsLayer,
	initializeLinesLayer,
	initializeObuLayer,
]

export const layersEnabledAtom = atom([])
