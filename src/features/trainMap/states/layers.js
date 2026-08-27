import { atom } from 'jotai';
import { initializeGeolocationLayer } from '../layers/geolocation';
import { initializeLinesLayer } from '../layers/lines';
import { initializeObuLayer } from '../layers/obu';
import { initializeStationsLayer } from '../layers/stations';
import { initializeTrainsLayer } from '../layers/trains';
import { initializeVoronoiLayer } from '../layers/voronoi';

export const layers = [
	initializeGeolocationLayer,
	initializeTrainsLayer,
	initializeStationsLayer,
	initializeLinesLayer,
	initializeVoronoiLayer,
	initializeObuLayer,
];

export const layersEnabledAtom = atom(localStorage.getItem('layers_enabled') === null ? {} : JSON.parse(localStorage.getItem('layers_enabled')));

export const updateLayerEnabledAtom = atom(null, (get, set, id, enabled) => {
	const updated = { ...get(layersEnabledAtom), [id]: enabled };
	set(layersEnabledAtom, updated);
	localStorage.setItem('layers_enabled', JSON.stringify(updated));
});
