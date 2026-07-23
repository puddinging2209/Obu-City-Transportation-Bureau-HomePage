import 'maplibre-gl/dist/maplibre-gl.css';
import React from 'react';
import Map from 'react-map-gl/maplibre';
import lineShapeData from '../data/lineShape.json';
import linesData from '../data/lines.json';
import stationsData from '../data/stations.json';
import { dia } from '../utils/readOud';
import TrainMapWorker from '../utils/trainMapWorker?worker';

function TrainMap() {
	const workerRef = React.useRef()

	const mapHandle = (mapEl) => {
		if (!mapEl) {
			return
		}
		mapEl.on('load', () => {
			const map = mapEl.getMap()
			const stations = Object.values(stationsData)
			Object.entries(lineShapeData).forEach(([name, shape]) => {
				const line = linesData[name]
				map.addSource(name, {
					type: 'geojson',
					data: {
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'LineString',
							coordinates: shape.map(s => [s[1], s[0]])
						}
					}
				})
				map.addLayer({
					id: name,
					type: 'line',
					source: name,
					layout: {
						'line-join': 'round',
						'line-cap': 'round'
					},
					paint: {
						'line-color': line?.color ?? '#999999',
						'line-width': 4
					}
				});
			})

			workerRef.current = new TrainMapWorker()
			Promise.all(
				new Set(Object.values(linesData).filter(e => e.json && e.stations).map(e => e.json))
					.values().map(async id => {
						return dia(id)
					})
			).then(ouds => {
				workerRef.current.postMessage({
					type: 'setOuds',
					ouds
				})
			})
		})
	}

	return (
		<Map
			ref={mapHandle}
			initialViewState={{
				latitude: 35.0086145360,
				longitude: 136.9621485834,
				zoom: 10
			}}
			style={{ width: 600, height: 400 }}
			mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
		/>
	);
}

export default TrainMap
