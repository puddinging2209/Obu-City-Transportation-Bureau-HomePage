import { atom } from 'jotai'
import { initializeLinesLayer } from '../layers/lines'
import { initializeObuLayer } from '../layers/obu'
import { initializeStationsLayer } from '../layers/stations'
import { initializeTrainsLayer } from '../layers/trains'
import { initializeVoronoiLayer } from '../layers/voronoi'

export const layers = [
	initializeTrainsLayer,
	initializeStationsLayer,
	initializeLinesLayer,
	initializeVoronoiLayer,
	initializeObuLayer,
]

export const layersEnabledAtom = atom([])
