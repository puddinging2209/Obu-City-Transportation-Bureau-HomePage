import React from 'react';

import { Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtomValue, useSetAtom } from 'jotai';

import { addMyStationAtom, myStationsAtom, settingsAtom } from '../atom/atom.js';
import { label } from '../utils/Station.js';
import { toTimeString } from '../utils/Time.js';
import TrainStopsDialog from './TrainStopsDialog.jsx';

import lines from '../data/lines.json';

/*
 * segments: Array<{
 *   from: string
 *   to: string
 *   depTime: number
 *   arrTime: number
 *   typeName: string
 *   terminal: string
 *   line: string
 * }>
 */
export default function TransferOutput({ result }) {
	const segments = result?.segments;
	const header = result?.header;

	const [showDialog, setShowDialog] = React.useState(false);
	const [pushed, setPushed] = React.useState(null);

	const [showFareDialog, setShowFareDialog] = React.useState(false);

	const settings = useAtomValue(settingsAtom);

	if (!segments || segments.length === 0) return null;

	const requiredTime = header.requiredTime;
	const fare = header.fare;

	function copyUrl() {
		const url = window.location.href;
		navigator.clipboard
			.writeText(url)
			.then(() => {
				alert('リンクをコピーしました！');
			})
			.catch(() => {
				alert('リンクのコピーに失敗しました');
			});
	}

	function searchRideStation(segments, i) {
		const seg = segments[i];
		for (let j = i - 1; j >= 0; j--) {
			if (segments[j].train.number !== seg.train.number || segments[j].train.number === '') {
				return segments[j].to;
			}
		}
		return segments[0].from;
	}

	return (
		<>
			<Card sx={{ width: { xs: '100%', md: '70%' }, mx: 'auto', my: 4 }}>
				<CardContent>
					<Stack direction='row' justifyContent='space-between'>
						<Button variant='outlined' size='medium' onClick={copyUrl}>
							経路を共有
						</Button>
						<Box>
							<Typography
								variant='h6'
								fontWeight='bold'
							>{`${toTimeString(segments[0].depTime)}発 ${toTimeString(segments.at(-1).arrTime)}着`}</Typography>
							<Typography variant='body1'>
								{(requiredTime.h > 0 ? `所要時間：${requiredTime.h}時間 ${requiredTime.m}分` : `所要時間：${requiredTime.m}分`) +
									(settings.general.showSeconds ? ` ${requiredTime.s}秒` : '')}
							</Typography>
						</Box>
						<Stack direction='column' gap={0.5} alignItems='flex-end' sx={{ cursor: 'pointer' }} onClick={() => setShowFareDialog(true)}>
							<Typography variant='bpdy1'>{fare.regular ? `運賃: ${fare.regular}円` : '運賃情報なし'}</Typography>
							<Typography variant='body1'>{fare.ic ? `IC運賃: ${fare.ic}円` : '運賃情報なし'}</Typography>
						</Stack>
					</Stack>

					<Box sx={{ mt: 2 }}>
						<StationBox depTime={segments[0].depTime} StationId={segments[0].from} disableArrTime={true} />

						{segments.map((seg, i) => {
							const isWalking = seg.train === 'walking';
							const isContinue = i > 0 && seg.train.number === segments[i - 1]?.train.number && seg.train.number !== '';
							const isContinueNext =
								i < segments.length - 1 && seg.train.number === segments[i + 1]?.train.number && seg.train.number !== '';
							return seg.line.map((line, j) => {
								const isInnerContinue = j !== 0 || isContinue;
								const isInnerContinueNext = j !== seg.line.length - 1 || isContinueNext;
								const isSameLineName = j > 0 && lines[line]?.show === lines[seg.line[j - 1]]?.show;
								return (
									<div key={`${seg.depTime}-${line}`}>
										<Box
											sx={{
												ml: '5%',
												p: 0.5,
												pl: '3%',
												textAlign: 'left',
												borderLeft: isWalking ? 5 : 10,
												borderColor: isWalking ? 'black' : (lines[line]?.color ?? 'green'),
											}}
										>
											{!isInnerContinue &&
												(isWalking ?
													<Typography variant='h6'>{`徒歩(改札外乗り換え) ${seg.meter}m`}</Typography>
												:	<Typography variant='h6'>
														{`${seg.typeName}${seg.train.name?.replace(seg.typeName, '')} ${seg.train.count != '' ? `${seg.train.count}号` : ''} ${label(seg.terminal)}行`}
													</Typography>)}
											{!isWalking && !isSameLineName && (
												<Typography variant='body1'>{`${lines[line]?.show}${isInnerContinue ? '(直通)' : ''} `}</Typography>
											)}
											{!isInnerContinueNext && !isWalking && (
												<Button
													variant='outlined'
													size='small'
													sx={{ mt: 1 }}
													onClick={() => {
														setShowDialog(true);
														setPushed({
															...seg,
															from: searchRideStation(segments, i),
														});
													}}
												>
													停車駅
												</Button>
											)}
										</Box>
										{!isInnerContinueNext && (
											<StationBox
												arrTime={seg.arrTime}
												depTime={segments[i + 1]?.depTime}
												StationId={seg.to}
												disableDepTime={i === segments.length - 1}
											/>
										)}
									</div>
								);
							});
						})}
					</Box>
				</CardContent>
				<TrainStopsDialog
					dep={pushed}
					line={pushed?.line[0]}
					isShowDialog={showDialog}
					onClose={() => setShowDialog(false)}
					emphasized={[`${pushed?.from},${pushed?.depTime}`, `${pushed?.to},${pushed?.arrTime}`]}
				/>
			</Card>
			<FareDialog open={showFareDialog} onClose={() => setShowFareDialog(false)} distance={header.distance} fare={fare.regular} />
		</>
	);
}

function StationBox({ arrTime, depTime, StationId, disableArrTime = false, disableDepTime = false }) {
	const theme = useTheme();
	const myStations = useAtomValue(myStationsAtom);
	const setMyStations = useSetAtom(addMyStationAtom);

	const showSeconds = useAtomValue(settingsAtom).general.showSeconds;
	const timeWidth = 42 * (!showSeconds ? 1 : 1.6);

	return (
		<Box sx={{ width: '100%', display: 'flex', borderRadius: 1, p: 1, gap: 1 }} bgcolor={theme.palette.mode === 'light' ? '#DDD' : '#333'}>
			<Box sx={{ flex: `0 0 ${timeWidth}px`, textAlign: 'center' }}>
				<Typography variant='body1'>{disableArrTime ? '出発' : toTimeString(arrTime)}</Typography>
				<Typography variant='body1'>{disableDepTime ? '到着' : toTimeString(depTime)}</Typography>
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					verticalAlign: 'middle',
					px: 1,
					py: 'auto',
				}}
			>
				<Typography variant='h6' fontWeight='bold'>
					{label(StationId)}
				</Typography>
			</Box>
			<Button
				variant='outlined'
				size='small'
				sx={{ ml: 'auto' }}
				disabled={myStations.includes(StationId)}
				onClick={() => setMyStations(StationId)}
			>
				マイ駅に追加
			</Button>
		</Box>
	);
}

function FareDialog({ open, onClose, distance, fare }) {
	const [term, setTerm] = React.useState(1);
	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>定期券の料金</DialogTitle>
			<DialogContent>
				<Select value={term} onChange={(e) => setTerm(e.target.value)}>
					{Array.from({ length: 3 }, (_, i) => Array.from({ length: 12 }, (_, j) => [i, j + 1]))
						.flat()
						.map(([year, month]) => {
							const [y, m] = [year + Math.floor(month / 12), month % 12];
							return (
								<MenuItem key={`${y}-${m}`} value={y * 12 + m}>
									{y > 0 ?
										m > 0 ?
											`${y}年${m}か月`
										:	`${y}年`
									:	`${m}か月`}
								</MenuItem>
							);
						})}
				</Select>
				<Stack direction='column' gap={1} sx={{ mt: 2 }}>
					<Stack direction='row' gap={1}>
						<Typography variant='body1'>通勤定期券:</Typography>
						<Typography variant='body1'>{`${(18 * term + 12) * fare}円`}</Typography>
					</Stack>
					<Stack direction='row' gap={1}>
						<Typography variant='body1'>通学定期券:</Typography>
						<Typography variant='body1'>{`${(12 * term + 8) * fare}円`}</Typography>
					</Stack>
					<Typography variant='body2' color='text.secondary'>
						(いずれも最短経路の場合)
					</Typography>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
