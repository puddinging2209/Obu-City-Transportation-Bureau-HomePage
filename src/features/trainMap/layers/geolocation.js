export async function initializeGeolocationLayer({ map, store }) {
	let watchId = null
	map.addSource('geolocation', {
		type: 'geojson',
		data: {
			'type': 'Feature',
			'geometry': {
				'type': 'Point',
				'coordinates': [0, 0]
			},
			'layout': {
				'visibility': 'none'
			}
		}
	})
	map.addLayer({
		id: 'geolocation',
		type: 'circle',
		source: 'geolocation',
		paint: {
			'circle-radius': 6,
			'circle-color': '#195eff',
			'circle-stroke-color': '#fff',
			'circle-stroke-width': 3.5
		}
	})

	return {
		id: 'geolocation',
		name: '現在位置',
		defaultEnabled: false,
		enable() {
			watchId = navigator.geolocation.watchPosition(e => {
				map.getSource('geolocation').setData({
					'type': 'Feature',
					'geometry': {
						'type': 'Point',
						'coordinates': [e.coords.longitude, e.coords.latitude]
					},
					'layout': {
						'visibility': 'visible'
					}
				})
			}, null, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
			map.setLayoutProperty('geolocation', 'visibility', 'visible')
		},
		disable() {
			if (watchId) {
				navigator.geolocation.clearWatch(watchId)
				watchId = null
			}
			map.setLayoutProperty('geolocation', 'visibility', 'none')
		},
		update() { }
	}
}
