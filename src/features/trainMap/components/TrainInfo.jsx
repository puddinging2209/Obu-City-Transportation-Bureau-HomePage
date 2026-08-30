import { Box, Grid, Stack, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import linesData from '../../../data/lines.json';
import routesData from '../../../data/routes.json';
import typesData from '../../../data/types.json';
import { settingsAtom } from '../../../utils/Atom';
import { name } from '../../../utils/Station';
import { toTimeString as getTime, toTime } from '../../../utils/Time';

export function TrainInfo({ train }) {
	const { showSeconds } = useAtomValue(settingsAtom).general;

	const route = routesData.routes[routesData.trains[train.number]];
	const length = route.flat().reduce((p, c) => p + c.length, 0);
	const stations = train.stops.map((s, i) => ({ ...s, index: i }));
	const stops = stations.filter((s) => s.stopType === 'stop');

	const scrollToDep = () => {
		const el = document.getElementsByClassName('emphasized')[0];
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<Stack>
			<Stack alignItems='flex-start'>
				<Typography>{train.number}</Typography>
				<Typography variant='h6' textAlign='left'>
					{typesData[train.type].name} {name(stations.at(-1).id)}行き
				</Typography>
				<Typography>
					{(length / 1000).toFixed(2)}km {getTime(stations[0].dep)}発 → {getTime(stations.at(-1).arr)}着
				</Typography>
				<Typography>
					{stops.length - 1} / {stations.length - 1}駅停車 {((length / 1000 / (stations.at(-1).arr - stations[0].dep)) * 3600).toFixed(2)}
					km/h
				</Typography>
			</Stack>
			<Stack
				sx={{
					paddingBlock: '16px',
				}}
			>
				{stops.map((s, i) => {
					const segmentLength = route[i]?.reduce?.((p, c) => p + c.length, 0);
					const segmentDurationSec = stops[i + 1]?.arr - s.dep;
					const segmentDuration = toTime(segmentDurationSec);

					return (
						<Box key={i}>
							<Box
								gridTemplateColumns={`24px ${showSeconds ? '4' : '3'}rem 1fr`}
								gap='6px'
								sx={{
									display: 'grid',
									height: '0px',
									alignContent: 'center',
								}}
							>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
									}}
								>
									<Box
										sx={{
											width: '16px',
											aspectRatio: '1/1',
											borderRadius: '100%',
											background: 'white',
											outline: 'solid 2px black',
											zIndex: 1,
										}}
									></Box>
								</Box>
								<Stack direction='column'>
									{s.arr ?
										<Typography>{getTime(s.arr)}</Typography>
									:	<></>}
									{s.dep ?
										<Typography>{getTime(s.dep)}</Typography>
									:	<></>}
								</Stack>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
									}}
								>
									<Typography textAlign='left'>{name(s.id)}</Typography>
								</Box>
							</Box>
							{stops[i + 1] ?
								<Grid
									gridTemplateColumns='24px 1fr'
									gap='36px'
									sx={{
										display: 'grid',
										height: '128px',
									}}
								>
									<Box
										sx={{
											height: '100%',
											display: 'flex',
											justifyContent: 'center',
										}}
									>
										<Box
											sx={{
												width: '8px',
												height: '100%',
												background: linesData[stops[i + 1].lineName]?.color ?? '#999999',
											}}
										/>
									</Box>
									<Box
										sx={{
											height: '100%',
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
											alignItems: 'flex-start',
										}}
									>
										<Typography>
											{(segmentLength / 1000).toFixed(2)}km {segmentDuration.h > 0 && `${segmentDuration.h}時間`}
											{segmentDuration.m > 0 && `${segmentDuration.m}分`}
											{showSeconds && segmentDuration.s > 0 && `${segmentDuration.s}秒`}
										</Typography>
										<Typography>
											{stops[i + 1].index - s.index - 1}駅 {((segmentLength / 1000 / segmentDurationSec) * 3600).toFixed(2)}km/h
										</Typography>
									</Box>
								</Grid>
							:	<></>}
						</Box>
					);
				})}
			</Stack>
		</Stack>
	);
}
