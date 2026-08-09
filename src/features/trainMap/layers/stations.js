import linesData from '../../../data/lines.json';
import stationsData from '../../../data/stations.json';
import getDirections from '../../../utils/getDirections';
import { stationLogAtom } from '../states/log';

export async function initializeStationsLayer({ map, store }) {
	const getStationPriority = stationData => {
		// 表示優先度 = 停車種別数 * 路線数 + 10(終点の場合)
		return Math.max(...stationData.routes.map(r => {
			return Object.values(linesData[r].stations
				.find(s => s.id === stationData.id)?.types ?? {})
				.filter(s => s).length
		})) * stationData.routes.length + (getDirections(stationData.id).length === 1 ? 10 : 0)
	}
	const getFeatureCollection = () => {
		const stationLogsVisitedList = new Set(store.get(stationLogAtom).map(s => s.id))
		return {
			type: 'FeatureCollection',
			features: Object.entries(stationsData).map(([_, s]) => {
				return {
					type: 'Feature',
					properties: {
						name: s.name,
						priority: -getStationPriority(s),
						icon: stationLogsVisitedList.has(s.id) ? 'subway_visited' : 'subway'
					},
					geometry: {
						type: 'Point',
						coordinates: [s.lng, s.lat]
					}
				}
			})
		}
	}
	map.addSource('stations', {
		type: 'geojson',
		data: getFeatureCollection()
	})
	const subwayIcon = new Image();
	await new Promise(resolve => {
		subwayIcon.onload = resolve
		subwayIcon.onerror = resolve
		subwayIcon.src = './icons/subway.png'
	})
	const subwayVisitedIcon = new Image();
	await new Promise(resolve => {
		subwayVisitedIcon.onload = resolve
		subwayVisitedIcon.onerror = resolve
		subwayVisitedIcon.src = './icons/subway_visited.png'
	})
	map.addImage('subway', subwayIcon);
	map.addImage('subway_visited', subwayVisitedIcon);
	map.addLayer({
		id: 'stations',
		type: 'symbol',
		source: 'stations',
		minzoom: 9.5,
		layout: {
			'icon-image': ['get', 'icon'],
			'icon-size': 0.25,
			'text-field': ['get', 'name'],
			'text-offset': [0.7, 0],
			'text-anchor': 'left',
			'text-size': 13,
			'symbol-sort-key': ['get', 'priority']
		},
		paint: {
			'text-halo-color': '#fff',
			'text-halo-width': 1,
			'text-halo-blur': 0
		}
	});
	let unsubscribeFn = null

	return {
		id: 'stations',
		name: '駅',
		defaultEnabled: true,
		enable() {
			map.setLayoutProperty('stations', 'visibility', 'visible')
			unsubscribeFn = store.sub(stationLogAtom, () => {
				map.getSource('stations').setData(getFeatureCollection())
			})
		},
		disable() {
			map.setLayoutProperty('stations', 'visibility', 'none')
			if (unsubscribeFn) {
				unsubscribeFn()
				unsubscribeFn = null
			}
		},
		update() { }
	}
}
