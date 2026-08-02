import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from 'deck.gl';
import linesData from '../../../data/lines.json';
import typesData from '../../../data/types.json';
import { dia } from '../.././../utils/readOud';
import TrainMapWorker from '../trainMapWorker?worker';

export async function initializeTrainsLayer({ map, store }) {
	const hexToRgb = (hex) => {
		return [
			parseInt(hex.substring(1, 3), 16),
			parseInt(hex.substring(3, 5), 16),
			parseInt(hex.substring(5, 7), 16)
		]
	}

	const worker = new TrainMapWorker()
	const ouds = await Promise.all(
		new Set(Object.values(linesData).filter(e => e.json && e.stations).map(e => e.json))
			.values().map(async id => {
				return dia(id)
			})
	)
	worker.postMessage({
		type: 'setOuds',
		ouds
	})

	const trainOverlay = new MapboxOverlay({
		interleaved: true,
		layers: []
	})
	map.addControl(trainOverlay)

	let visible = true

	worker.addEventListener('message', ({ data }) => {
		switch (data.type) {
			case 'calcPositionResult': {
				const points = data.data.filter(t => t.coordinate).map(t => ({
					id: t.number,
					position: t.coordinate.reverse(),
					color: [...hexToRgb(typesData[t.type]?.color ?? '#ff00ff'), 255],
				}))
				const layer = new ScatterplotLayer({
					id: 'trains',
					data: points,
					pickable: false,

					getPosition: d => d.position,
					getFillColor: d => d.color,
					getLineColor: [255, 255, 255, 255],

					stroked: true,
					filled: true,
					radiusUnits: 'pixels',
					getRadius: 6,
					lineWidthUnits: 'pixels',
					getLineWidth: 1.5,

					updateTriggers: {
						getPosition: data.sec,
						getFillColor: data.sec
					}
				})
				trainOverlay.setProps({
					layers: visible ? [layer] : []
				})
				break;
			}
		}
	})

	return {
		name: '列車',
		defaultEnabled: true,
		enable() {
			visible = true
		},
		disable() {
			visible = false
			trainOverlay.setProps({ layers: [] })
		},
		update(sec) {
			if (!visible) return
			worker.postMessage({
				type: 'calcPosition',
				sec
			})
		}
	}
}
