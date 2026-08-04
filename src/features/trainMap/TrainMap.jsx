import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LayersIcon from '@mui/icons-material/Layers';
import { Box, CircularProgress, Fab, Stack } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React from 'react';
import Map from 'react-map-gl/maplibre';
import { BottomSheet } from './components/BottomSheet';
import { LayersControl } from './components/LayersControl';
import { TimeControl } from './components/TimeControl';
import { layers, layersEnabledAtom } from './states/layers';
import { setBottomSheetComponentAtom, setBottomSheetTitleAtom } from './states/sheet';
import { timeAtom } from './states/time';

function TrainMap() {
	const date = new Date()
	const store = useStore()
	const layersRef = React.useRef([])
	const [isLoading, setIsLoading] = React.useState(true)
	const [layersEnabled, setLayersEnabled] = useAtom(layersEnabledAtom)
	const timeState = useAtomValue(timeAtom)
	const setBottomSheetContent = useSetAtom(setBottomSheetComponentAtom)
	const setBottomSheetTitle = useSetAtom(setBottomSheetTitleAtom)

	const mapHandle = (mapEl) => {
		if (!mapEl) {
			return
		}
		mapEl.on('load', async () => {
			const map = mapEl.getMap()
			map.addControl(new maplibregl.NavigationControl())

			for (const l of layers.toReversed()) {
				const layer = await l({ map, store })
				layersRef.current.push(layer)
				layer.defaultEnabled ? layer.enable() : layer.disable()
			}
			layersRef.current.reverse()
			setLayersEnabled(layersRef.current.map(l => l.defaultEnabled))
			setIsLoading(false)
		})
	}

	React.useEffect(() => {
		let id
		const tick = () => {
			const sec = (timeState.baseSimulationTime + (performance.now() - timeState.startAt) * timeState.speedRate / 1000) % (60 * 60 * 24)
			layersRef.current.forEach((l, i) => {
				if (layersEnabled[i]) l.update(sec)
			})
			id = requestAnimationFrame(tick)
		}
		id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id)
	}, [layersRef, timeState, layersEnabled])

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
			<Stack
				sx={{
					position: 'absolute',
					left: '16px',
					bottom: '16px',
				}}
				spacing={2}
			>
				<Fab onClick={() => {
					setBottomSheetContent(LayersControl, { layers: layersRef.current })
					setBottomSheetTitle('レイヤー表示')
				}}>
					<LayersIcon></LayersIcon>
				</Fab>
				<Fab onClick={() => {
					setBottomSheetContent(TimeControl)
					setBottomSheetTitle('時間操作')
				}}>
					<AccessTimeIcon></AccessTimeIcon>
				</Fab>
			</Stack>
			<BottomSheet></BottomSheet>
		</Box>
	)
}

export default TrainMap
