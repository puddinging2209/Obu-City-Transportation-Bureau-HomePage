import CloseIcon from '@mui/icons-material/Close';
import LocationPinIcon from '@mui/icons-material/LocationPin';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Box, Button, Dialog, DialogTitle, IconButton, List, ListItemButton, ListItemText, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Popup } from 'react-map-gl/maplibre';
import { label } from '../../../utils/Station';
import { toTimeString } from '../../../utils/Time';

function normalizePopupPosition(position) {
	if (!Array.isArray(position) || position.length < 2) {
		return [0, 0];
	}
	const [first, second] = position;
	if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
		return [second, first];
	}
	return [first, second];
}

export default function TrainPopup({ train, setActiveTrain, handleOpenBottomSheet, handleSwitchTrain, isTracking, setIsTracking }) {
	const position = React.useMemo(() => normalizePopupPosition(train.position), [train.position]);
	const otherStoppedTrains = train.stoppedTrains?.filter((stoppedTrain) => stoppedTrain.number !== train.rawTrainData.number) ?? [];
	const [isStoppedTrainDialogOpen, setIsStoppedTrainDialogOpen] = React.useState(false);
	const sec = train.sec < 10800 ? train.sec + 86400 : train.sec;
	const type = train.rawTrainData.type;
	const terminal = React.useMemo(
		() => (train.rawTrainData.stops.at(-1).id !== 'ct2' ? label(train.rawTrainData.stops.at(-1).id) : '中部国際空港'),
		[train.rawTrainData],
	);
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

	React.useEffect(() => {
		if (!currentStop) {
			setIsStoppedTrainDialogOpen(false);
		}
	}, [currentStop]);
	const theme = useTheme();
	return (
		<Popup
			longitude={position[0]}
			latitude={position[1]}
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
					onClick={() => {
						setIsTracking((prev) => !prev);
					}}
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						color: isTracking ? '#36f' : '#0a0',
						p: 1,
					}}
				>
					<LocationPinIcon />
				</IconButton>
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
							{`${label(currentSegment[0].id)} > `}
							<wbr />
							{`${label(currentSegment[1].id)}`}
						</Typography>
						<Typography
							sx={{ fontSize: '13px' }}
							noWrap
						>{`${toTimeString(currentSegment[0].dep)} > ${toTimeString(currentSegment[1].arr)}`}</Typography>
					</>
				}
				<Stack direction='column' spacing={1} sx={{ mt: 0.5 }}>
					<Button
						variant='contained'
						size='small'
						sx={{ fontSize: '11px', py: 0.2, mt: 0.5 }}
						onClick={() => handleOpenBottomSheet(train.rawTrainData)}
					>
						詳細を見る
					</Button>
					{currentStop && (
						<Button
							variant='outlined'
							size='small'
							startIcon={<SwapHorizIcon />}
							sx={{ fontSize: '11px', py: 0.2, mt: 0.5 }}
							onClick={() => setIsStoppedTrainDialogOpen(true)}
							disabled={otherStoppedTrains.length === 0}
						>
							他の停車列車
						</Button>
					)}
				</Stack>
			</Box>
			<Dialog open={isStoppedTrainDialogOpen} onClose={() => setIsStoppedTrainDialogOpen(false)} fullWidth maxWidth='xs'>
				<DialogTitle>{label(train.rawTrainData.stoppingSta)}に停車中の列車</DialogTitle>
				<List disablePadding>
					{train.stoppedTrains
						?.sort((a, b) => a.stops.find((s) => s.id === currentStop?.id).dep - b.stops.find((s) => s.id === currentStop?.id).dep)
						.map((stoppedTrain) => {
							const stoppedTrainTerminal =
								stoppedTrain.stops.at(-1).id !== 'ct2' ? label(stoppedTrain.stops.at(-1).id) : '中部国際空港';
							const isSelected = stoppedTrain.number === train.rawTrainData.number;
							const currentIndex = stoppedTrain.stops.findIndex((s) => s.arr && s.dep && s.arr <= sec && sec < s.dep) ?? null;
							const currentStop = currentIndex !== -1 ? stoppedTrain.stops[currentIndex] : null;
							const lineName = (() => {
								for (let i = currentIndex + 1; i < stoppedTrain.stops.length; i++) {
									const stop = stoppedTrain.stops[i];
									if (stop.stopType === 'stop') return stop.lineName;
								}
								return '';
							})();

							return (
								<ListItemButton
									key={stoppedTrain.number}
									disabled={isSelected}
									onClick={() => {
										setIsStoppedTrainDialogOpen(false);
										handleSwitchTrain(stoppedTrain, train.stoppedTrains);
									}}
								>
									<ListItemText
										primary={`${toTimeString(currentStop?.dep)}発 ${stoppedTrain.type} ${stoppedTrainTerminal}行${isSelected ? '（選択中）' : ''}`}
										secondary={`${lineName} ${stoppedTrain.number}`}
									/>
								</ListItemButton>
							);
						})}
				</List>
			</Dialog>
		</Popup>
	);
}
