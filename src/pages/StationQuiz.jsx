import React from 'react';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	ButtonGroup,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import linesData from '../data/lines.json';
import nodesData from '../data/nodes.json';
import stationsData from '../data/stations.json';

const HISTORY_KEY = 'stationQuizHistory';
const HISTORY_LIMIT = 5;
const MIN_MAP_ZOOM = 1;
const MAX_MAP_ZOOM = 6;
const MAP_WIDTH = 900;
const MAP_HEIGHT = 900;
const MAP_PADDING = 32;

function normalizeGuess(value) {
	return value
		.normalize('NFKC')
		.replace(/\s/g, '')
		.replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

function getRouteStationCode(line, stationId) {
	const numberNode = Object.entries(nodesData).find(([, node]) => node.line === line.id && node.id === stationId)?.[0];
	const fromNode = numberNode?.match(/^([A-Z]+\d+)/)?.[1];
	const stationCodes = stationsData[stationId]?.code ?? [];
	if (fromNode && stationCodes.includes(fromNode)) return fromNode;

	const lineCode = stationCodes.find((stationCode) => stationCode.startsWith(line.code) && /\d/.test(stationCode));
	return lineCode ?? stationCodes[0] ?? '番号未設定';
}

const subwayLines = Object.values(linesData)
	.filter((line) => line.type === 'subway')
	.map((line) => ({
		...line,
		stations: line.stations
			.map(({ id }) => {
				const station = stationsData[id];
				return station ? { ...station, number: getRouteStationCode(line, id) } : null;
			})
			.filter(Boolean),
	}));

const allStations = Array.from(new Map(subwayLines.flatMap((line) => line.stations).map((station) => [station.id, station])).values());
const stationsByGuess = new Map();
allStations.forEach((station) => {
	[station.name, station.kana].filter(Boolean).forEach((value) => {
		const key = normalizeGuess(value);
		const matches = stationsByGuess.get(key) ?? [];
		matches.push(station);
		stationsByGuess.set(key, matches);
	});
});
stationsByGuess.forEach((matches, key) => matches.sort((a, b) => Number(normalizeGuess(b.name) === key) - Number(normalizeGuess(a.name) === key)));

const coordinateBounds = allStations.reduce(
	(bounds, station) => ({
		minLat: Math.min(bounds.minLat, station.lat),
		maxLat: Math.max(bounds.maxLat, station.lat),
		minLng: Math.min(bounds.minLng, station.lng),
		maxLng: Math.max(bounds.maxLng, station.lng),
	}),
	{ minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity },
);

function readHistory() {
	try {
		const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
		if (!Array.isArray(parsed)) throw new TypeError('Station quiz history must be an array');
		return {
			records: parsed.filter((item) => Number.isFinite(item.count) && typeof item.savedAt === 'string'),
			error: false,
		};
	} catch (error) {
		console.error('Failed to load station quiz history', error);
		return { records: [], error: true };
	}
}

function StationProgressMap({ guessedIds }) {
	const theme = useTheme();
	const [zoom, setZoom] = React.useState(1);
	const [isDragging, setIsDragging] = React.useState(false);
	const mapViewportRef = React.useRef(null);
	const mapSvgRef = React.useRef(null);
	const dragStart = React.useRef(null);
	const activePointers = React.useRef(new Map());
	const pinchState = React.useRef(null);
	const zoomRef = React.useRef(zoom);
	const activeZoomAnchor = React.useRef(null);
	const pendingZoomAnchor = React.useRef(null);

	React.useEffect(() => {
		const map = mapSvgRef.current;
		if (!map) return;

		function handleWheel(event) {
			event.preventDefault();
			if (event.deltaY !== 0) {
				changeZoom(zoomRef.current + (event.deltaY < 0 ? 0.1 : -0.1), {
					x: event.clientX,
					y: event.clientY,
				});
			}
		}

		map.addEventListener('wheel', handleWheel, { passive: false });
		return () => map.removeEventListener('wheel', handleWheel);
	}, []);

	React.useLayoutEffect(() => {
		const viewport = mapViewportRef.current;
		const map = mapSvgRef.current;
		const anchor = pendingZoomAnchor.current;
		if (!viewport || !map || !anchor) return;

		let frame = requestAnimationFrame(() => {
			frame = requestAnimationFrame(() => {
				const viewportBounds = viewport.getBoundingClientRect();
				const mapBounds = map.getBoundingClientRect();
				viewport.scrollLeft = anchor.mapX * mapBounds.width - (anchor.x - viewportBounds.left);
				viewport.scrollTop = anchor.mapY * mapBounds.height - (anchor.y - viewportBounds.top);
				if (pendingZoomAnchor.current === anchor) {
					pendingZoomAnchor.current = null;
				}
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [zoom]);

	function changeZoom(value, clientPoint) {
		const nextZoom = Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, Number(value.toFixed(2))));
		const previousZoom = zoomRef.current;
		if (nextZoom === previousZoom) return;

		const viewport = mapViewportRef.current;
		const map = mapSvgRef.current;
		if (viewport && map) {
			const existingAnchor = activeZoomAnchor.current;
			const keepAnchor = clientPoint && existingAnchor && existingAnchor.x === clientPoint.x && existingAnchor.y === clientPoint.y;
			const viewportBounds = viewport.getBoundingClientRect();
			const mapBounds = map.getBoundingClientRect();
			const anchorX = clientPoint?.x ?? viewportBounds.left + viewport.clientWidth / 2;
			const anchorY = clientPoint?.y ?? viewportBounds.top + viewport.clientHeight / 2;
			const anchor =
				keepAnchor ? existingAnchor : (
					{
						mapX: (anchorX - mapBounds.left) / mapBounds.width,
						mapY: (anchorY - mapBounds.top) / mapBounds.height,
						x: anchorX,
						y: anchorY,
					}
				);
			activeZoomAnchor.current = anchor;
			pendingZoomAnchor.current = anchor;

			map.style.width = `${nextZoom * 100}%`;
			map.style.minWidth = `${560 * nextZoom}px`;
			const nextMapBounds = map.getBoundingClientRect();
			const nextViewportBounds = viewport.getBoundingClientRect();
			viewport.scrollLeft = anchor.mapX * nextMapBounds.width - (anchor.x - nextViewportBounds.left);
			viewport.scrollTop = anchor.mapY * nextMapBounds.height - (anchor.y - nextViewportBounds.top);
		}

		zoomRef.current = nextZoom;
		setZoom(nextZoom);
	}

	const plot = (station) => {
		const x =
			MAP_PADDING +
			((station.lng - coordinateBounds.minLng) / (coordinateBounds.maxLng - coordinateBounds.minLng)) * (MAP_WIDTH - MAP_PADDING * 2);
		const y =
			MAP_PADDING +
			((coordinateBounds.maxLat - station.lat) / (coordinateBounds.maxLat - coordinateBounds.minLat)) * (MAP_HEIGHT - MAP_PADDING * 2);
		return `${x},${y}`;
	};

	function handlePointerDown(event) {
		if (event.button !== 0) return;

		if (event.pointerType === 'touch') {
			activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
			event.currentTarget.setPointerCapture(event.pointerId);
			if (activePointers.current.size === 2) {
				dragStart.current = null;
				pinchState.current = getPinchState();
				setIsDragging(false);
				return;
			}
		}

		dragStart.current = {
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			scrollLeft: event.currentTarget.scrollLeft,
			scrollTop: event.currentTarget.scrollTop,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		setIsDragging(true);
	}

	function getPinchState() {
		const [first, second] = [...activePointers.current.entries()];
		if (!first || !second) return null;
		const dx = second[1].x - first[1].x;
		const dy = second[1].y - first[1].y;
		return {
			pointerIds: [first[0], second[0]],
			distance: Math.hypot(dx, dy),
			center: { x: (first[1].x + second[1].x) / 2, y: (first[1].y + second[1].y) / 2 },
		};
	}

	function handlePointerMove(event) {
		if (event.pointerType === 'touch' && activePointers.current.has(event.pointerId)) {
			activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
			const pinch = pinchState.current;
			if (pinch && pinch.pointerIds.every((pointerId) => activePointers.current.has(pointerId))) {
				const first = activePointers.current.get(pinch.pointerIds[0]);
				const second = activePointers.current.get(pinch.pointerIds[1]);
				const dx = second.x - first.x;
				const dy = second.y - first.y;
				const distance = Math.hypot(dx, dy);
				const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
				if (pinch.distance > 0) {
					changeZoom(zoomRef.current * (distance / pinch.distance), pinch.center);
				}

				const movementX = center.x - pinch.center.x;
				const movementY = center.y - pinch.center.y;
				const viewport = mapViewportRef.current;
				viewport.scrollLeft -= movementX;
				viewport.scrollTop -= movementY;
				if (pendingZoomAnchor.current) {
					pendingZoomAnchor.current.x = center.x;
					pendingZoomAnchor.current.y = center.y;
				}
				if (activeZoomAnchor.current) {
					activeZoomAnchor.current.x = center.x;
					activeZoomAnchor.current.y = center.y;
				}
				pinchState.current = { ...pinch, distance, center };
			} else if (dragStart.current?.pointerId === event.pointerId) {
				activeZoomAnchor.current = null;
				event.currentTarget.scrollLeft = dragStart.current.scrollLeft + dragStart.current.x - event.clientX;
				event.currentTarget.scrollTop = dragStart.current.scrollTop + dragStart.current.y - event.clientY;
			}
			return;
		}

		if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return;

		activeZoomAnchor.current = null;
		event.currentTarget.scrollLeft = dragStart.current.scrollLeft + dragStart.current.x - event.clientX;
		event.currentTarget.scrollTop = dragStart.current.scrollTop + dragStart.current.y - event.clientY;
	}

	function handlePointerUp(event) {
		if (event.pointerType === 'touch') {
			activePointers.current.delete(event.pointerId);
			pinchState.current = null;
			dragStart.current = null;
			const remainingPointer = activePointers.current.entries().next().value;
			if (remainingPointer) {
				dragStart.current = {
					pointerId: remainingPointer[0],
					x: remainingPointer[1].x,
					y: remainingPointer[1].y,
					scrollLeft: event.currentTarget.scrollLeft,
					scrollTop: event.currentTarget.scrollTop,
				};
				setIsDragging(true);
			} else {
				setIsDragging(false);
			}
			return;
		}

		if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return;

		dragStart.current = null;
		setIsDragging(false);
	}

	return (
		<Box sx={{ position: 'relative', width: '100%' }}>
			<Stack
				direction='row'
				spacing={1}
				alignItems='center'
				justifyContent='flex-end'
				sx={{
					position: 'absolute',
					top: 8,
					right: 8,
					zIndex: 1,
					px: 1,
					py: 0.5,
					borderRadius: 1,
					bgcolor: 'background.paper',
					boxShadow: 1,
					maxWidth: 'calc(100% - 16px)',
				}}
			>
				<Typography variant='body2' color='text.secondary' aria-live='polite'>
					{Math.round(zoom * 100)}%
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					ドラッグで移動・2本指で拡大縮小
				</Typography>
				<ButtonGroup size='small' variant='outlined' aria-label='地図の拡大縮小'>
					<Button aria-label='地図を縮小' disabled={zoom <= MIN_MAP_ZOOM} onClick={() => changeZoom(zoomRef.current - 0.25)}>
						<ZoomOutIcon />
					</Button>
					<Button aria-label='地図を拡大' disabled={zoom >= MAX_MAP_ZOOM} onClick={() => changeZoom(zoomRef.current + 0.25)}>
						<ZoomInIcon />
					</Button>
					<Button aria-label='地図の倍率をリセット' disabled={zoom === 1} onClick={() => changeZoom(1)}>
						100%
					</Button>
				</ButtonGroup>
			</Stack>
			<Box
				ref={mapViewportRef}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				sx={{
					width: '100%',
					overflow: 'auto',
					maxHeight: '70vh',
					cursor: isDragging ? 'grabbing' : 'grab',
					touchAction: 'none',
					userSelect: 'none',
				}}
			>
				<svg
					ref={mapSvgRef}
					viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
					role='img'
					aria-label='地下鉄の路線と駅の位置。緑は入力済み、赤は未入力'
					style={{ display: 'block', width: `${zoom * 100}%`, minWidth: `${560 * zoom}px` }}
				>
					<rect width={MAP_WIDTH} height={MAP_HEIGHT} rx='16' fill={theme.palette.background.default} />
					{[...Array(5)].map((_, index) => {
						const position = MAP_PADDING + ((MAP_WIDTH - MAP_PADDING * 2) * index) / 4;
						return (
							<line
								key={`grid-x-${index}`}
								x1={position}
								y1={MAP_PADDING}
								x2={position}
								y2={MAP_HEIGHT - MAP_PADDING}
								stroke={theme.palette.text.primary}
								strokeOpacity='0.08'
								vectorEffect='non-scaling-stroke'
							/>
						);
					})}
					{[...Array(5)].map((_, index) => {
						const position = MAP_PADDING + ((MAP_HEIGHT - MAP_PADDING * 2) * index) / 4;
						return (
							<line
								key={`grid-y-${index}`}
								x1={MAP_PADDING}
								y1={position}
								x2={MAP_WIDTH - MAP_PADDING}
								y2={position}
								stroke={theme.palette.text.primary}
								strokeOpacity='0.08'
								vectorEffect='non-scaling-stroke'
							/>
						);
					})}
					{allStations.length > 0 &&
						subwayLines.map((line) => (
							<polyline
								key={line.id}
								points={[...line.stations, ...(line.isLoop ? [line.stations[0]] : [])].map(plot).join(' ')}
								fill='none'
								stroke={line.color}
								strokeOpacity='0.55'
								strokeWidth='2'
								strokeLinejoin='round'
								strokeLinecap='round'
								vectorEffect='non-scaling-stroke'
							/>
						))}
					{allStations.map((station) => {
						const isGuessed = guessedIds.has(station.id);
						const [cx, cy] = plot(station).split(',');
						return (
							<circle
								key={station.id}
								cx={cx}
								cy={cy}
								r={5 / zoom}
								fill={isGuessed ? '#2e7d32' : '#d32f2f'}
								stroke={theme.palette.background.paper}
								strokeWidth='1.5'
								vectorEffect='non-scaling-stroke'
								aria-label={isGuessed ? '入力済みの駅' : '未入力の駅'}
							/>
						);
					})}
					{allStations
						.filter((station) => guessedIds.has(station.id))
						.map((station) => {
							const [x, y] = plot(station).split(',').map(Number);
							return (
								<text
									key={`label-${station.id}`}
									x={x + 9 / zoom}
									y={y}
									fontSize={12 / zoom}
									fontWeight='600'
									dominantBaseline='middle'
									fill={theme.palette.text.primary}
									stroke={theme.palette.background.paper}
									strokeWidth={3 / zoom}
									strokeLinejoin='round'
									paintOrder='stroke'
									vectorEffect='non-scaling-stroke'
								>
									{station.name}
								</text>
							);
						})}
				</svg>
			</Box>
		</Box>
	);
}

function StationQuiz() {
	const [guessedIds, setGuessedIds] = React.useState(() => new Set());
	const [guess, setGuess] = React.useState('');
	const [message, setMessage] = React.useState('');
	const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
	const [historyState] = React.useState(readHistory);
	const { records: history } = historyState;
	const gameStartedAt = React.useRef(Date.now());
	const gameSnapshot = React.useRef({ count: 0 });
	const lastSavedCount = React.useRef(0);
	const isComposingGuess = React.useRef(false);

	React.useEffect(() => {
		gameSnapshot.current = { count: guessedIds.size };
	}, [guessedIds]);

	React.useEffect(() => {
		const saveResult = () => {
			const { count } = gameSnapshot.current;
			if (count <= lastSavedCount.current) return;

			const result = {
				count,
				total: allStations.length,
				durationSec: Math.max(0, Math.floor((Date.now() - gameStartedAt.current) / 1000)),
				savedAt: new Date().toISOString(),
			};
			try {
				const previous = readHistory();
				const next = [result, ...previous.records].slice(0, HISTORY_LIMIT);
				localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
				lastSavedCount.current = count;
			} catch (error) {
				console.error('Failed to save station quiz result', error);
			}
		};

		window.addEventListener('pagehide', saveResult);
		return () => {
			window.removeEventListener('pagehide', saveResult);
			saveResult();
		};
	}, []);

	function handleGuessValue(value) {
		setGuess(value);
		const matches = stationsByGuess.get(normalizeGuess(value));
		if (!matches) return;

		const station = matches.find((candidate) => !guessedIds.has(candidate.id));
		if (!station) {
			setMessage('その駅はすでに入力済みです。');
			return;
		}

		gameSnapshot.current = { count: guessedIds.size + 1 };
		setGuessedIds((current) => new Set(current).add(station.id));
		setGuess('');
		setMessage(`「${station.name}」を入力済みにしました。`);
	}

	function handleGuessChange(event) {
		if (isComposingGuess.current || event.nativeEvent.isComposing) {
			setGuess(event.target.value);
			return;
		}
		handleGuessValue(event.target.value);
	}

	function handleGuessCompositionEnd(event) {
		isComposingGuess.current = false;
		handleGuessValue(event.target.value);
	}

	return (
		<Box sx={{ maxWidth: 1100, mx: 'auto' }}>
			<Stack direction='row' justifyContent='space-between' alignItems='center' spacing={1} sx={{ mb: 1 }}>
				<Typography variant='h5' component='h1'>
					駅名を思い出そう
				</Typography>
				<Button variant='outlined' size='small' onClick={() => setIsHistoryOpen(true)}>
					保存した記録（{history.length}）
				</Button>
			</Stack>
			<Typography color='text.secondary' sx={{ mb: 2 }}>
				大府市営地下鉄の駅名を入力してください。
			</Typography>

			<Paper variant='outlined' sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
					<TextField
						fullWidth
						label='駅名'
						value={guess}
						onChange={handleGuessChange}
						onCompositionStart={() => {
							isComposingGuess.current = true;
						}}
						onCompositionEnd={handleGuessCompositionEnd}
						autoComplete='off'
						inputProps={{ 'aria-label': '駅名' }}
					/>
					<Chip
						icon={<CheckCircleIcon />}
						label={`${guessedIds.size} / ${allStations.length} 駅`}
						color='success'
						variant='outlined'
						sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontSize: '1rem', height: 40 }}
					/>
				</Stack>
				{message && (
					<Alert severity={message.includes('すでに') ? 'info' : 'success'} onClose={() => setMessage('')} sx={{ mb: 2 }}>
						{message}
					</Alert>
				)}
				<Typography variant='body2' color='text.secondary'>
					ゲームページを離れると正解数をこの端末に保存し、次回は最初からになります。
				</Typography>
			</Paper>

			<Paper variant='outlined' sx={{ p: { xs: 1, sm: 2 }, mb: 3 }}>
				<Stack direction='row' spacing={2} sx={{ px: 1, pb: 1, flexWrap: 'wrap' }}>
					<Stack direction='row' spacing={0.75} alignItems='center'>
						<CheckCircleIcon color='success' fontSize='small' />
						<Typography variant='body2'>入力済み</Typography>
					</Stack>
					<Stack direction='row' spacing={0.75} alignItems='center'>
						<RadioButtonUncheckedIcon color='error' fontSize='small' />
						<Typography variant='body2'>未入力</Typography>
					</Stack>
					<Typography variant='body2' color='text.secondary'>
						駅の位置と各路線のおおよその経路
					</Typography>
				</Stack>
				<StationProgressMap guessedIds={guessedIds} />
			</Paper>

			<Typography variant='h6' component='h2' sx={{ mb: 1 }}>
				路線別の入力状況
			</Typography>
			{!allStations.length && <Alert severity='error'>駅データを読み込めませんでした。</Alert>}
			{[...subwayLines]
				.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
				.map((line) => {
					const guessed = line.stations.filter((station) => guessedIds.has(station.id));
					const missing = line.stations.filter((station) => !guessedIds.has(station.id));
					return (
						<Accordion key={line.id} disableGutters>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Stack direction='row' spacing={1} alignItems='center' sx={{ minWidth: 0 }}>
									<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: line.color, flexShrink: 0 }} />
									<Typography sx={{ fontWeight: 600 }}>{line.name}</Typography>
									<Typography variant='body2' color='text.secondary'>
										{guessed.length} / {line.stations.length}
									</Typography>
								</Stack>
							</AccordionSummary>
							<AccordionDetails>
								<Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography>入力済みの駅名（{guessed.length}駅）</Typography>
									</AccordionSummary>
									<AccordionDetails>
										{guessed.length ?
											<Stack direction='row' useFlexGap flexWrap='wrap' spacing={1}>
												{guessed.map((station) => (
													<Chip
														key={station.id}
														size='small'
														color='success'
														variant='outlined'
														label={`${station.number} ${station.name}`}
													/>
												))}
											</Stack>
										:	<Typography variant='body2' color='text.secondary'>
												まだ入力されていません。
											</Typography>
										}
									</AccordionDetails>
								</Accordion>
								<Accordion disableGutters elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider' }}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography>未入力の駅（{missing.length}駅）</Typography>
									</AccordionSummary>
									<AccordionDetails>
										{missing.length ?
											<Stack direction='row' useFlexGap flexWrap='wrap' spacing={1}>
												{missing.map((station) => (
													<Chip key={station.id} size='small' label={station.number} />
												))}
											</Stack>
										:	<Typography variant='body2' color='text.secondary'>
												この路線の駅はすべて入力済みです。
											</Typography>
										}
									</AccordionDetails>
								</Accordion>
							</AccordionDetails>
						</Accordion>
					);
				})}

			<Dialog open={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} fullWidth maxWidth='sm'>
				<DialogTitle>保存した記録</DialogTitle>
				<DialogContent dividers>
					{historyState.error && (
						<Alert severity='warning' sx={{ mb: history.length ? 2 : 0 }}>
							前回の記録を読み込めませんでした。今回のプレイ結果は新しい記録として保存されます。
						</Alert>
					)}
					{history.length > 0 ?
						<Stack spacing={1}>
							{history.map((result, index) => (
								<Stack
									key={`${result.savedAt}-${index}`}
									direction={{ xs: 'column', sm: 'row' }}
									justifyContent='space-between'
									spacing={0.5}
								>
									<Typography variant='body2'>{new Date(result.savedAt).toLocaleString('ja-JP')}</Typography>
									<Typography variant='body2' fontWeight={600}>
										{result.count} / {result.total ?? allStations.length} 駅
										{Number.isFinite(result.durationSec) &&
											`・${Math.floor(result.durationSec / 60)}分${String(result.durationSec % 60).padStart(2, '0')}秒`}
									</Typography>
								</Stack>
							))}
						</Stack>
					:	<Typography color='text.secondary'>保存された記録はありません。</Typography>
					}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsHistoryOpen(false)}>閉じる</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

export default StationQuiz;
