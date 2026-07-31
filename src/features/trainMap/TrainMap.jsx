import { Box, Checkbox, CircularProgress, FormControlLabel, Stack, useTheme } from '@mui/material';
import { useStore } from 'jotai';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React from 'react';
import Map from 'react-map-gl/maplibre';
import { TimeControl } from './components/TimeControl';
import { initializeLinesLayer } from './layers/lines';
import { initializeStationsLayer } from './layers/stations';
import { initializeTrainsLayer } from './layers/trains';

const layers = [
	initializeLinesLayer,
	initializeStationsLayer,
	initializeTrainsLayer
]

function TrainMap() {
	const date = new Date()
	const theme = useTheme()
	const store = useStore()
	const layersRef = React.useRef([])
	const [isLoading, setIsLoading] = React.useState(true)
	const [layersEnabled, setLayersEnabled] = React.useState([])
	const [playerState, setPlayerState] = React.useState({
		startAt: performance.now(),
		baseSimulationTime: date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + 0.001 * date.getMilliseconds(),
		speedRate: 1
	})

	const mapHandle = (mapEl) => {
		if (!mapEl) {
			return
		}
		mapEl.on('load', async () => {
			const map = mapEl.getMap()
			map.addControl(new maplibregl.NavigationControl())

			layersRef.current = await Promise.all(layers.map(l => l({ map, store })))
			setLayersEnabled(layersRef.current.map(l => l.defaultEnabled))
			setIsLoading(false)
		})
	}

	React.useEffect(() => {
		const id = setInterval(() => {
			const sec = (playerState.baseSimulationTime + (performance.now() - playerState.startAt) * playerState.speedRate / 1000) % (60 * 60 * 24)
			layersRef.current.forEach((l, i) => {
				if (layersEnabled[i]) l.update(sec)
			})
		}, 1000 / 24);
		return () => clearInterval(id)
	}, [layersRef, playerState, layersEnabled])

	return (
		<Box sx={{ position: "relative", width: "100%", height: "100%" }}>
			{isLoading ? (<Box sx={{
				position: "absolute",
				display: "flex",
				width: "100%",
				height: "100%",
				background: "#00000044",
				zIndex: 1,
				justifyContent: "center",
				alignItems: "center"
			}}>
				<CircularProgress></CircularProgress>
			</Box>) : <></>}
			<Map
				ref={mapHandle}
				initialViewState={{
					latitude: 35.0086145360,
					longitude: 136.9621485834,
					zoom: 10
				}}
				mapStyle="https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json"
			/>
			<Stack sx={{
				position: "absolute",
				width: "300px",
				height: "200px",
				padding: "16px",
				left: "12px",
				bottom: "12px",
				borderRadius: "8px",
				bgcolor: theme.palette.background.default
			}}>
				<TimeControl state={playerState} setter={setPlayerState}></TimeControl>
				{
					layersRef.current.map((l, i) => (
						<FormControlLabel
							key={i}
							label={l.name}
							control={
								<Checkbox
									checked={layersEnabled[i] ?? false}
								></Checkbox>
							}
							onChange={e => {
								setLayersEnabled(layersEnabled.with(i, e.target.checked))
								e.target.checked ? l.enable() : l.disable()
							}}
						></FormControlLabel>
					))
				}
			</Stack>
		</Box>
	)
}

export default TrainMap
