import { Box } from "@mui/material";
import "leaflet/dist/leaflet.css";
import React from 'react';

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

			map.setView([35.681236, 139.767125], 15);
			L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution:
					'&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
			}).addTo(map);
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
