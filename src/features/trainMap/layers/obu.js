export async function initializeObuLayer({ map, store }) {
	map.addSource('obu_city', {
		type: 'geojson',
		data: './geojson/obu_city.geojson'
	})
	map.addLayer({
		id: 'obu_city_fill',
		type: 'fill',
		source: 'obu_city',
		paint: {
			'fill-color': '#15a2e9',
			'fill-opacity': 0.3,
		},
		layout: {
			'fill-sort-key': -10000
		}
	})
	map.addLayer({
		id: 'obu_city_boundary',
		type: 'line',
		source: 'obu_city',
		paint: {
			'line-color': '#15a2e9',
			'line-width': 2
		}
	})

	return {
		name: '大府市の範囲',
		defaultEnabled: false,
		enable() {
			map.setLayoutProperty('obu_city_fill', 'visibility', 'visible')
			map.setLayoutProperty('obu_city_boundary', 'visibility', 'visible')
		},
		disable() {
			map.setLayoutProperty('obu_city_fill', 'visibility', 'none')
			map.setLayoutProperty('obu_city_boundary', 'visibility', 'none')
		},
		update() { }
	}
}
