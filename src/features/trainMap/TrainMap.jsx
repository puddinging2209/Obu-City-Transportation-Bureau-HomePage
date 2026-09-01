import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LayersIcon from '@mui/icons-material/Layers';
import { Box, CircularProgress, Fab, Stack } from '@mui/material';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React from 'react';
import Map from 'react-map-gl/maplibre';
import { settingsAtom } from '../../utils/Atom';
import { BottomSheet } from './components/BottomSheet';
import { LayersControl } from './components/LayersControl';
import { LoginButton } from './components/LoginButton';
import { TimeControl } from './components/TimeControl';
import { TrainInfo } from './components/TrainInfo';
import TrainPopup from './components/TrainPopup';
import { layers, layersEnabledAtom, updateLayerEnabledAtom } from './states/layers';
import { clearBottomSheetAtom, setBottomSheetComponentAtom, setBottomSheetTitleAtom } from './states/sheet';
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

	const { updateInterval } = useAtomValue(settingsAtom).map;

	// ★ 追従ポップアップ用のState
	const [activeTrain, setActiveTrain] = React.useState(null); // { id, position: [lng, lat], type, rawTrainData }

	// ★ イベントリスナー内で常に最新の activeTrain.id を参照できるようにするためのRef
	const activeTrainIdRef = React.useRef(null);
	activeTrainIdRef.current = activeTrain?.id;

	// ★ ポップアップ内のボタンからボトムシートを開く処理
	const handleOpenBottomSheet = (trainData) => {
		setBottomSheetContent(TrainInfo, { train: trainData });
		setBottomSheetTitle('列車情報');
	};

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
					// ★ 列車レイヤー初期化用に関数を拡張して引数を渡す
					const layer = await l({
						map,
						store,
						onSelectTrain: (trainInfo) => {
							setActiveTrain(trainInfo);
						},
						onUpdateActiveTrain: ({ points, trains, sec }) => {
							if (!activeTrainIdRef.current) return;

							const currentTrain = points.find((p) => p.id === activeTrainIdRef.current);
							if (currentTrain) {
								setActiveTrain((prev) => {
									if (!prev) return null;
									if (prev.position[0] === currentTrain.position[0] && prev.position[1] === currentTrain.position[1]) {
										return { ...prev, sec };
									}
									return { ...prev, sec, position: currentTrain.position };
								});
								return;
							}

							setActiveTrain((prev) => {
								if (!prev) return null;
								const nextTrainNumber = prev.rawTrainData?.nextTrainNum;
								if (!nextTrainNumber) {
									return null;
								}

								const nextTrain = trains?.find((t) => String(t.number) === String(nextTrainNumber));
								if (!nextTrain) {
									return null;
								}

								return {
									id: nextTrain.number,
									sec,
									position: [...nextTrain.coordinate].reverse(),
									type: nextTrain.type,
									rawTrainData: nextTrain,
								};
							});
						},
					});

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

	React.useEffect(() => {
		let id;
		let latestUpdatedAt = 0;
		const tick = (now) => {
			if (now - latestUpdatedAt >= updateInterval) {
				const sec = (timeState.baseSimulationTime + ((performance.now() - timeState.startAt) * timeState.speedRate) / 1000) % (60 * 60 * 24);
				layersRef.current.forEach((l) => {
					if (layersEnabled[l.id]) l.update(sec);
				});
				latestUpdatedAt = now;
			}
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
				mapStyle='https://tile.openstreetmap.jp/styles/maptiler-basic-ja/style.json'
			>
				{/* ★ activeTrainが存在するときだけポップアップを表示 */}
				{activeTrain && (
					<TrainPopup train={activeTrain} setActiveTrain={setActiveTrain} handleOpenBottomSheet={handleOpenBottomSheet}></TrainPopup>
				)}
			</Map>
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
	);
}

export default TrainMap;
