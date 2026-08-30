import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Popup } from 'react-map-gl/maplibre';
import { label } from '../../../utils/Station';
import { toTimeString } from '../../../utils/Time';

export default function TrainPopup({ train, setActiveTrain, handleOpenBottomSheet }) {
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
