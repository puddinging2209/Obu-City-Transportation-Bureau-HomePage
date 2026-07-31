import linesData from '../../../data/lines.json';
import typesData from '../../../data/types.json';
import { dia } from '../.././../utils/readOud';
import TrainMapWorker from '../trainMapWorker?worker';

export async function initializeTrainsLayer({ map, store }) {
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
	map.addSource('trains', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: []
		}
	})
	map.addLayer({
		id: 'trains',
		type: 'circle',
		source: 'trains',
		paint: {
			'circle-radius': 6,
			'circle-color': ['get', 'color'],
			'circle-stroke-color': '#fff',
			'circle-stroke-width': 1
		}
	})
	worker.addEventListener('message', ({ data }) => {
		switch (data.type) {
			case 'calcPositionResult':
				map.getSource('trains').setData({
					type: 'FeatureCollection',
					features: data.data.filter(t => t.coordinate).map(t => {
						return {
							type: 'Feature',
							properties: {
								number: t.number,
								priority: 100,
								color: typesData[t.type]?.color ?? '#f0f'
							},
							geometry: {
								type: 'Point',
								coordinates: t.coordinate.reverse()
							}
						}
					})
				})
				break;
		}
	})
	map.on('click', 'trains', e => {
		const feature = e.features?.[0]
		if (!feature) return

		console.log(feature.properties.number)
	})

	return {
		name: '列車',
		defaultEnabled: true,
		enable() {
			map.setLayoutProperty('trains', 'visibility', 'visible')
		},
		disable() {
			map.setLayoutProperty('trains', 'visibility', 'none')
		},
		update(sec) {
			worker.postMessage({
				type: 'calcPosition',
				sec
			})
		}
	}
}
