import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LayersIcon from '@mui/icons-material/Layers';
import { Box, CircularProgress, Fab, Stack } from '@mui/material';
import { Provider, useAtomValue, useSetAtom, useStore } from 'jotai';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React from 'react';
import Map from 'react-map-gl/maplibre';
import { BottomSheet } from './components/BottomSheet';
import { LayersControl } from './components/LayersControl';
import { LoginButton } from './components/LoginButton';
import { TimeControl } from './components/TimeControl';
import { layers, layersEnabledAtom, updateLayerEnabledAtom } from './states/layers';
import { clearBottomSheetAtom, setBottomSheetComponentAtom, setBottomSheetTitleAtom, store as sheetStore, trackingTrainAtom } from './states/sheet';
import { timeAtom } from './states/time';

function TrainMap() {
	const date = new Date();
	const store = useStore();
	const containerRef = React.useRef();
	const layersRef = React.useRef([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const layersEnabled = useAtomValue(layersEnabledAtom);
	const updateLayerEnabled = useSetAtom(updateLayerEnabledAtom);
	const timeState = useAtomValue(timeAtom);
	const setBottomSheetContent = useSetAtom(setBottomSheetComponentAtom);
	const setBottomSheetTitle = useSetAtom(setBottomSheetTitleAtom);
	const clearBottomSheet = useSetAtom(clearBottomSheetAtom);
	const trackingTrain = useAtomValue(trackingTrainAtom, { store: sheetStore });
	const isTrackingRef = React.useRef(false);

	const mapHandle = (mapEl) => {
		if (!mapEl) {
			return;
		}
		mapEl.on('load', async () => {
			const map = mapEl.getMap();
			map.addControl(new maplibregl.NavigationControl());
			map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left');

			for (const l of layers.toReversed()) {
				try {
					const layer = await l({ map, store });
					if (!layer) {
						continue;
					}
					layersRef.current.push(layer);
					const enabled = layersEnabled[layer.id] ?? layer.defaultEnabled;
					enabled ? layer.enable() : layer.disable();
					updateLayerEnabled(layer.id, enabled);
				} catch (e) {
					console.error(e);
				}
			}
			layersRef.current.reverse();
			setIsLoading(false);
		});
	};

	/**
	 * requestAnimationFrame のループ内で呼び出し、カメラを動点の座標に即座に同期させる関数
	 *
	 * @param {Object} mapRef - react-map-gl の ref オブジェクト (useRef)
	 * @param {Array<number>} nextPos - 次の座標 [longitude, latitude]
	 */
	const syncCameraToPoint = (mapRef, nextPos) => {
		// 追尾フラグがOFF、またはマップの準備ができていない場合は処理をスキップ
		if (!isTrackingRef.current || !mapRef.current) return;

		// アニメーションなしで、現在のフレームの座標へ即時にカメラを同期
		mapRef.current.jumpTo({
			center: nextPos,
		});
	};

	// ユーザーが地図をドラッグしたら追尾をOFFにする
	const onDragStart = () => {
		isTrackingRef.current = false;
	};

	React.useEffect(() => {
		let id;
		const tick = () => {
			const sec = (timeState.baseSimulationTime + ((performance.now() - timeState.startAt) * timeState.speedRate) / 1000) % (60 * 60 * 24);
			layersRef.current.forEach((l) => {
				if (layersEnabled[l.id]) l.update(sec);
			});
			syncCameraToPoint(mapHandle, trackingTrain.coordinates.toReversed());
			// console.log(trackingTrain);
			id = requestAnimationFrame(tick);
		};
		id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id);
	}, [layersRef, timeState, layersEnabled]);

	React.useEffect(() => {
		if (!containerRef.current) return;

		const node = containerRef.current.parentNode.parentNode;
		node.style.padding = '0px';
		node.style.paddingBottom = '0px';
		return () => {
			node.style.padding = null;
			node.style.paddingBottom = null;
			clearBottomSheet();
		};
	}, [containerRef]);

	return (
		<Provider store={sheetStore}>
			<Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
				{isLoading ?
					<Box
						sx={{
							position: 'absolute',
							display: 'flex',
							width: '100%',
							height: '100%',
							background: '#00000044',
							zIndex: 1052,
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<CircularProgress></CircularProgress>
					</Box>
				:	<></>}
				<Map
					ref={mapHandle}
					initialViewState={{
						latitude: 35.008614536,
						longitude: 136.9621485834,
						zoom: 10,
					}}
					attributionControl={false}
					onDragStart={onDragStart}
					mapStyle='https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json'
				/>
				<Stack
					sx={{
						position: 'absolute',
						left: '16px',
						bottom: '16px',
					}}
					spacing={2}
				>
					<Fab
						onClick={() => {
							setBottomSheetContent(LayersControl, { layers: layersRef.current });
							setBottomSheetTitle('レイヤー表示');
						}}
					>
						<LayersIcon></LayersIcon>
					</Fab>
					<Fab
						onClick={() => {
							setBottomSheetContent(TimeControl);
							setBottomSheetTitle('時間操作');
						}}
					>
						<AccessTimeIcon></AccessTimeIcon>
					</Fab>
				</Stack>
				<BottomSheet></BottomSheet>
				<LoginButton></LoginButton>
			</Box>
		</Provider>
	);
}

export default TrainMap;
