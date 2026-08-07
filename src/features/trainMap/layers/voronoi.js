import { Delaunay } from 'd3-delaunay';
import stationsData from '../../../data/stations.json';

export async function initializeVoronoiLayer({ map, store }) {
	const stations = Object.values(stationsData)
	const stationLogsVisitedList = new Set(JSON.parse(localStorage.getItem('visitedStations') || '[]').map(s => s.id))

	const lat0 = stations.reduce((s, p) => s + p.lat, 0) / stations.length;
	const lng0 = stations.reduce((s, p) => s + p.lng, 0) / stations.length;
	const M_PER_DEG_LAT = 110574;
	const mPerDegLng = 111320 * Math.cos(lat0 * Math.PI / 180);

	const toXY = (lng, lat) => {
		return [
			(lng - lng0) * mPerDegLng,
			(lat - lat0) * M_PER_DEG_LAT
		];
	}
	const toLngLat = (x, y) => {
		return [
			lng0 + x / mPerDegLng,
			lat0 + y / M_PER_DEG_LAT
		];
	}

	const xy = stations.map(s => toXY(s.lng, s.lat));
	const xmin = Math.min(...xy.map(s => s[0])) - 1000;
	const xmax = Math.max(...xy.map(s => s[0])) + 1000;
	const ymin = Math.min(...xy.map(s => s[1])) - 1000;
	const ymax = Math.max(...xy.map(s => s[1])) + 1000;

	const delaunay = Delaunay.from(xy);
	const voronoi = delaunay.voronoi([xmin, ymin, xmax, ymax]);

	const getColor = (id) => {
		const isVisited = stationLogsVisitedList.has(id)
		return '#' + id.split('').map(s =>
			(Math.abs(Math.floor((parseInt(s, 36) - 10) / 25 * 127)) + (isVisited ? 128 : 0)).toString(16).padStart(2, '0')
		).join('')
	}

	const voronoiFeatures = [];
	for (let i = 0; i < stations.length; i++) {
		const cell = voronoi.cellPolygon(i);
		if (!cell) continue;
		const ring = cell.map(([x, y]) => toLngLat(x, y));
		voronoiFeatures.push({
			type: 'Feature',
			properties: {
				color: getColor(stations[i].id)
			},
			geometry: {
				type: 'Polygon',
				coordinates: [ring]
			}
		});
	}
	const voronoiGeojson = { type: 'FeatureCollection', features: voronoiFeatures };

	map.addSource('voronoi', { type: 'geojson', data: voronoiGeojson });

	map.addLayer({
		id: 'voronoi_fill',
		type: 'fill',
		source: 'voronoi',
		paint: {
			'fill-color': ['get', 'color'],
			'fill-opacity': 0.5
		}
	});

	map.addLayer({
		id: 'voronoi_boundary',
		type: 'line',
		source: 'voronoi',
		paint: {
			'line-color': ['get', 'color'],
			'line-width': 2,
			'line-opacity': 0.8
		}
	});

	return {
		id: 'voronoi',
		name: '駅ログ範囲',
		defaultEnabled: false,
		enable() {
			map.setLayoutProperty('voronoi_fill', 'visibility', 'visible')
			map.setLayoutProperty('voronoi_boundary', 'visibility', 'visible')
		},
		disable() {
			map.setLayoutProperty('voronoi_fill', 'visibility', 'none')
			map.setLayoutProperty('voronoi_boundary', 'visibility', 'none')
		},
		update() { }
	}
}
