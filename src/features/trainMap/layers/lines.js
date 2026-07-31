import linesData from '../../../data/lines.json';
import lineShapeData from '../../../data/lineShape.json';

export async function initializeLinesLayer({ map, store }) {
	map.addSource('lines', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: Object.entries(lineShapeData).map(([name, shape]) => {
				return {
					type: 'Feature',
					properties: {
						color: linesData[name]?.color ?? '#999999'
					},
					geometry: {
						type: 'LineString',
						coordinates: shape.map(s => [s[1], s[0]])
					}
				}
			})
		}
	})
	map.addLayer({
		id: 'lines',
		type: 'line',
		source: 'lines',
		layout: {
			'line-join': 'round',
			'line-cap': 'round'
		},
		paint: {
			'line-color': ['get', 'color'],
			'line-width': 4
		}
	});

	return {
		name: '線路',
		defaultEnabled: true,
		enable() {
			map.setLayoutProperty('lines', 'visibility', 'visible')
		},
		disable() {
			map.setLayoutProperty('lines', 'visibility', 'none')
		},
		update() {}
	}
}
