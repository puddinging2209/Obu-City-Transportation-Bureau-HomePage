import { atom } from 'jotai'
import { initializeGeolocationLayer } from '../layers/geolocation'
import { initializeLinesLayer } from '../layers/lines'
import { initializeObuLayer } from '../layers/obu'
import { initializeStationsLayer } from '../layers/stations'
import { initializeTrainsLayer } from '../layers/trains'
import { initializeVoronoiLayer } from '../layers/voronoi'

export const layers = [
	initializeGeolocationLayer,
	initializeTrainsLayer,
	initializeStationsLayer,
	initializeLinesLayer,
	initializeVoronoiLayer,
	initializeObuLayer,
]

export const layersEnabledAtom = atom([])
