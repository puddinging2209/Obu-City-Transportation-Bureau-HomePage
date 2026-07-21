import React from 'react';

import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtomValue, useSetAtom } from 'jotai';

import { addMyStationAtom, myStationsAtom } from '../utils/Atom.js';
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
								{requiredTime.h > 0 ? `所要時間：${requiredTime.h}時間 ${requiredTime.m}分` : `所要時間：${requiredTime.m}分`}
							</Typography>
						</Box>
						<Stack direction='column' gap={0.5} alignItems='flex-end'>
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
		</>
	);
}

function StationBox({ arrTime, depTime, StationId, disableArrTime = false, disableDepTime = false }) {
	const theme = useTheme();
	const myStations = useAtomValue(myStationsAtom);
	const setMyStations = useSetAtom(addMyStationAtom);

	return (
		<Box sx={{ width: '100%', display: 'flex', borderRadius: 1, p: 1, gap: 1 }} bgcolor={theme.palette.mode === 'light' ? '#DDD' : '#333'}>
			<Box sx={{ flex: '0 0 42px', textAlign: 'center' }}>
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
				disabled={myStations.map((sta) => sta?.id).includes(StationId)}
				onClick={() => setMyStations({ id: StationId, role: 'station' })}
			>
				マイ駅に追加
			</Button>
		</Box>
	);
}
