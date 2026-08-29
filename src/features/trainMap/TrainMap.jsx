import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import LayersIcon from '@mui/icons-material/Layers';
import { Box, Button, CircularProgress, Fab, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React from 'react';
import Map, { Popup } from 'react-map-gl/maplibre';
import { label } from '../../utils/Station';
import { toTimeString } from '../../utils/Time';
import { BottomSheet } from './components/BottomSheet';
import { LayersControl } from './components/LayersControl';
import { LoginButton } from './components/LoginButton';
import { TimeControl } from './components/TimeControl';
import { TrainInfo } from './components/TrainInfo';
import { layers, layersEnabledAtom, updateLayerEnabledAtom } from './states/layers';
import { clearBottomSheetAtom, setBottomSheetComponentAtom, setBottomSheetTitleAtom } from './states/sheet';
import { timeAtom } from './states/time';

function TrainPopup({ train, setActiveTrain, handleOpenBottomSheet }) {
	const sec = train.sec < 10800 ? train.sec + 86400 : train.sec;
	const type = train.rawTrainData.type;
	const terminal = train.rawTrainData.stops.at(-1).id !== 'ct2' ? label(train.rawTrainData.stops.at(-1).id) : '中部国際空港';
	const currentStop = train.rawTrainData.stops.find((s) => s.arr && s.dep && s.arr <= sec && sec < s.dep) ?? null;
	const currentSegment =
		currentStop ? null : (
			(() => {
				const stops = train.rawTrainData.stops;
				const j = stops.findIndex((s) => s.stopType === 'stop' && s.arr && sec < s.arr);
				for (let i = j - 1; i >= 0; i--) {
					if (stops[i].dep && stops[i].stopType === 'stop') {
						return [stops[i], stops[j]];
					}
				}
				return null;
			})()
		);

	const theme = useTheme();
	return (
		<Popup
			longitude={train.position[0]}
			latitude={train.position[1]}
			anchor='bottom'
			offset={15}
			closeButton={false}
			closeOnClick={false}
			onClose={() => setActiveTrain(null)}
		>
			{/* MapLibreの標準CSSをMUIのテーマカラーに上書きするグローバルstyle */}
			<style>{`
				.maplibregl-popup-content {
					background-color: ${theme.palette.background.paper} !important;
					box-shadow: ${theme.shadows[4]} !important;
				}
				/* 下の三角形（吹き出しの矢印）の色もテーマに合わせる */
				.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
					border-top-color: ${theme.palette.background.paper} !important;
				}
			`}</style>
			<Box
				sx={{
					p: 0.5,
				}}
			>
				<IconButton
					size='medium'
					onClick={() => setActiveTrain(null)}
					sx={{
						position: 'absolute',
						top: 0,
						right: 0,
						color: '#666',
						p: 1,
					}}
				>
					<CloseIcon fontSize='small' />
				</IconButton>

				<Typography sx={{ fontSize: '14px' }} noWrap>
					{train.id}
				</Typography>
				<Typography sx={{ fontSize: '16px', fontWeight: 'bold' }} noWrap>
					{type} {terminal}行
				</Typography>
				{currentStop ?
					<>
						<Typography sx={{ fontSize: '14px' }} noWrap>
							{label(currentStop.id)} 停車中
						</Typography>
						<Typography
							sx={{ fontSize: '13px' }}
							noWrap
						>{`${toTimeString(currentStop.arr)} > ${toTimeString(currentStop.dep)}`}</Typography>
					</>
				:	<>
						<Typography sx={{ fontSize: '14px', wordBreak: 'keep-all' }}>
							{`${label(currentSegment[0].id)} >`}
							<wbr />
							{`${label(currentSegment[1].id)}`}
						</Typography>
						<Typography
							sx={{ fontSize: '13px' }}
							noWrap
						>{`${toTimeString(currentSegment[0].dep)} > ${toTimeString(currentSegment[1].arr)}`}</Typography>
					</>
				}
				<Button
					variant='contained'
					size='small'
					sx={{ fontSize: '11px', py: 0.2, mt: 0.5 }}
					onClick={() => handleOpenBottomSheet(train.rawTrainData)}
				>
					詳細を見る
				</Button>
			</Box>
		</Popup>
	);
}

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
						onUpdateActiveTrain: ({ points, sec }) => {
							if (!activeTrainIdRef.current) return;

							// 配列(points)から現在追跡中のIDの列車を探して座標を追従させる
							const currentTrain = points.find((p) => p.id === activeTrainIdRef.current);
							if (currentTrain) {
								setActiveTrain((prev) => {
									if (!prev) return null;
									if (prev.position[0] === currentTrain.position[0] && prev.position[1] === currentTrain.position[1]) {
										return { ...prev, sec }; // 座標が変わっていなければState更新をスキップ
									}
									return { ...prev, sec, position: currentTrain.position };
								});
							} else {
								setActiveTrain(null); // データから消えたらポップアップを閉じる
							}
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
		const tick = () => {
			const sec = (timeState.baseSimulationTime + ((performance.now() - timeState.startAt) * timeState.speedRate) / 1000) % (60 * 60 * 24);
			layersRef.current.forEach((l) => {
				if (layersEnabled[l.id]) l.update(sec);
			});
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
