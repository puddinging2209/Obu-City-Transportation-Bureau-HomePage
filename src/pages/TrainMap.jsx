import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import lines from '../data/lines.json';
import stations from '../data/stations.json';
import trainMapData from '../data/trainMap.json';
import { dia } from '../utils/readOud';
import trainMapWorker from '../utils/trainMapWorker?worker';

function TrainMap() {
	const mapElementRef = React.useRef(null);
	const mapRef = React.useRef(null);
	const workerRef = React.useRef(null);
	React.useEffect(() => {
		const mapElement = mapElementRef.current;
		if (!mapElement) {
			return;
		}

		(async () => {
			const L = (await import('leaflet')).default;
			if (mapRef.current) {
				return;
			}
			const map = L.map(mapElement);
			mapRef.current = map;

			map.setView([35.0086145360, 136.9621485834], 12);
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
			}).addTo(map);
			Object.values(trainMapData).forEach(d => {
				L.polyline(d.line_coordinates.filter(l => l[0]), {
					color: d.color,
					weight: 5,
					opacity: 0.9
				}).addTo(map);
			})
			const stationLayers = {};
			Object.values(stations).forEach(s => {
				const layerZoomLevel = (() => {
					if (s.directions.length === 1 || (s.directions.length !== 2 && s.name.length === 2)) {
						return 10;
					}
					if (s.directions.length !== 2) {
						return 12;
					}
					return 14;
				})();
				stationLayers[layerZoomLevel] ??= L.layerGroup();
				L.marker([s.lat, s.lng], {
					icon: L.divIcon({
						html: `${s.name}`,
						className: 'stationLabel' + (layerZoomLevel <= 12 ? ' majorStation' : ''),
						iconSize: [120, 24],
						iconAnchor: [6, 12],
					})
				}).addTo(stationLayers[layerZoomLevel]);
			});

			const zoomHandle = () => {
				const zoom = map.getZoom();
				Object.entries(stationLayers).forEach(([level, layer]) => {
					if (level <= zoom) {
						if (!map.hasLayer(layer)) {
							map.addLayer(layer);
						}
					} else {
						map.removeLayer(layer);
					}
				});
			};
			map.on('zoomend', zoomHandle);
			zoomHandle();

			workerRef.current = new trainMapWorker();

			new Set(Object.values(lines).filter(e => e.json && e.stations).map(e => e.json)).values().forEach(async id => {
				const oud = await dia(id)
				workerRef.current.postMessage({
					type: 'setOud',
					id, oud
				})
			})

			const p = {}

			workerRef.current.addEventListener('message', ({ data }) => {
				switch (data.type) {
					case 'calcPositionResult': {
						console.log(data)
						Object.entries(data.data).forEach(([id, trains]) => {
							Object.entries(trains).forEach(([index, pos]) => {
								p[id + index] ??= L.marker([0, 0]).addTo(map);
								p[id + index].setLatLng(pos)
							})
						})
						break
					}

					default:
						break
				}
			})

			setInterval(() => {
				const date = new Date()
				const sec = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
				workerRef.current.postMessage({
					type: 'calcPosition',
					sec: sec + 20000
				})
			}, 1000)

			const points = {}
			Object.values(trainMapData).forEach(s => {
				points[s.name] = L.marker([0, 0], { label: s.name }).addTo(map);
			})
			let r = 0
			const t = () => {
				if (1 < r) {
					return
				}

				Object.entries(points).forEach(([s, p]) => {
					const lineCoordinates = trainMapData[s].line_coordinates
					for (let i = 0; i < lineCoordinates.length - 1; i++) {
						if (lineCoordinates[i + 1][2] < r) {
							continue
						}
						const rateInLine = (r - lineCoordinates[i][2]) / (lineCoordinates[i + 1][2] - lineCoordinates[i][2])
						const lat = lineCoordinates[i][0] + (lineCoordinates[i + 1][0] - lineCoordinates[i][0]) * rateInLine
						const lng = lineCoordinates[i][1] + (lineCoordinates[i + 1][1] - lineCoordinates[i][1]) * rateInLine
						p.setLatLng([lat, lng])
						break
					}
				})

				r += 0.0005
				requestAnimationFrame(t)
			}
			t()
		})();
	}, []);

	return (
		<Box
			sx={{ width: '100%', height: 'calc(100dvh - calc(64px + 40px))' }}
			ref={mapElementRef}
		></Box>
	)
}

export default TrainMap;
