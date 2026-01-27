import { Box } from "@mui/material";
import "leaflet/dist/leaflet.css";
import React from 'react';
import stations from '../data/stations.json';
import trainMapData from '../data/trainMap.json';

function TrainMap() {
	const mapElementRef = React.useRef(null);
	const mapRef = React.useRef(null);
	React.useEffect(() => {
		const mapElement = mapElementRef.current;
		if (!mapElement) {
			return;
		}

		(async () => {
			const L = (await import("leaflet")).default;
			if (mapRef.current) {
				return
			}
			const map = L.map(mapElement);
			mapRef.current = map;

			map.setView([35.0086145360, 136.9621485834], 12);
			L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution:
					'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
			}).addTo(map);
			Object.values(trainMapData).forEach(d => {
				L.polyline(d.line_coordinates.filter(l => l[0]).map(l => l.map(Number).toReversed()), {
					color: d.color,
					weight: 4,
					opacity: 0.75
				}).addTo(map);
			})
			Object.values(stations).forEach(s => {
				L.marker([s.lat, s.lng], {
					icon: L.divIcon({
						html: `${s.name}`,
						className: 'stationLabel',
						iconSize: [120, 24],
						iconAnchor: [6, 12],
					})
				}).addTo(map)
			})
		})()
	}, [])

	return (
		<Box
			sx={{ width: "100%", height: "calc(100dvh - calc(64px + 40px))" }}
			ref={mapElementRef}
		></Box>
	)
}

export default TrainMap
