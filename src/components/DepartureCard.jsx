import React from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Card, CardContent, CircularProgress, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';

import { addMyStationAtom, myStationsAtom } from '../utils/Atom.js';

import DepartureListDialog from './DepartureListDialog.jsx';
import DepartureRow from './DepartureRow.jsx';
import DirectionBottomSheet from './DirectionBottomSheet.jsx';
import OverflowMarquee from './OverflowMarquee.jsx';

import lines from '../data/lines.json';

import getDirections from '../utils/getDirections.js';
import { searchDeparture } from '../utils/readOud.js';
import { label } from '../utils/Station.js';
import { nowsecond } from '../utils/Time.js';

const StationContext = React.createContext(null);
const LineContext = React.createContext(null);

function DepartureCard({ station, addButton = false, removeButton = false }) {
	const [myStations, setMyStations] = useAtom(myStationsAtom);

	const [direction, setDirection] = React.useState(0);
	const [departures, setDepartures] = React.useState([]);

	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		setLoading(true);
		searchDeparture(station, directionOptions[direction]).then((deps) => {
			setDepartures(deps);
			setLoading(false);
		});
	}, [direction]);

	const addMyStation = useSetAtom(addMyStationAtom);

	function removeStation() {
		const s = myStations.filter((value) => value.id != station);
		setMyStations(s);
		localStorage.setItem('myStations', JSON.stringify(s));
	}

	const directionOptions = React.useMemo(() => getDirections(station), [station]);

	const [isOpenShowMore, setIsOpenShowMore] = React.useState(false);

	function showMoreDialog() {
		setIsOpenShowMore(true);
	}

	const [isOpenMobileSelector, setIsOpenMobileSelector] = React.useState({
		open: false,
		options: [],
	});

	return (
		<>
			<LineContext value={directionOptions[direction]?.line}>
				<StationContext value={station}>
					<Card
						key={station}
						sx={{
							width: { xs: '100%', md: 300 },
							minHeight: 240,
							position: 'relative',
							flexShrink: 0,
						}}
					>
						<CardContent>
							<Box sx={{ mb: 1 }}>
								<Typography variant='h6' sx={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap' }} noWrap>
									<OverflowMarquee text={label(station)} />
								</Typography>

								<Typography variant='body2' color='text.secondary' noWrap>
									{lines[directionOptions[direction]?.line]?.show}
								</Typography>
							</Box>

							<Box sx={{ display: { xs: 'none', md: 'block' } }}>
								<Select
									value={direction}
									onChange={(e) => setDirection(e.target.value)}
									renderValue={(i) => {
										return label(directionOptions[i]?.id) + ' 方面';
									}}
									sx={{
										height: 40,
										mb: 1,
									}}
									fullWidth
								>
									{directionOptions.map((o, i) => (
										<MenuItem key={i} value={i}>
											<Stack direction='row' justifyContent='space-between' sx={{ width: '100%' }}>
												<Typography
													sx={{
														fontSize: '14px',
														fontWeight: 'bold',
														color: 'inherit',
													}}
												>
													{label(o.id)} 方面
												</Typography>
												<Typography sx={{ fontSize: '12px', color: 'inherit' }}>{lines[o.line]?.show}</Typography>
											</Stack>
										</MenuItem>
									))}
								</Select>
							</Box>

							<Box sx={{ display: { xs: 'block', md: 'none' }, marginBottom: 1 }}>
								<Button
									variant='outlined'
									size='small'
									fullWidth
									onClick={() => {
										setIsOpenMobileSelector({
											open: true,
											options: directionOptions,
										});
									}}
								>
									{direction?.stationName}方面 ▼
								</Button>
							</Box>

							<Stack spacing={1}>
								{departures?.filter((d) => d.time >= nowsecond()).length !== 0 ?
									<Box>
										{departures
											?.filter((d) => d.time >= nowsecond())
											.slice(0, 2)
											?.map((dep) => (
												<DepartureRow key={dep.time} dep={dep} station={station} />
											))}
									</Box>
								: loading ?
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
											py: 2,
										}}
									>
										<CircularProgress size={30} />
									</Box>
								:	<Typography variant='h6' sx={{ textAlign: 'center' }}>
										本日の運転は終了しました
									</Typography>
								}
							</Stack>

							<Button
								size='small'
								sx={{ mt: 1 }}
								onClick={() => {
									showMoreDialog(true);
								}}
							>
								もっと見る
							</Button>
							<IconButton
								size='small'
								sx={{
									position: 'absolute',
									bottom: 8,
									right: 8,
									display: removeButton ? 'block' : 'none',
								}}
								onClick={() => removeStation()}
							>
								<CloseIcon fontSize='small' />
							</IconButton>
							<br />
							<Button
								sx={{ mt: 1, display: addButton ? 'block' : 'none' }}
								variant='contained'
								size='small'
								onClick={() => addMyStation({ id: station, role: 'station' })}
								disabled={myStations.some((s) => s.id === station)}
								disableElevation
							>
								マイ駅に追加
							</Button>
						</CardContent>
					</Card>

					<DirectionBottomSheet
						open={isOpenMobileSelector.open}
						options={isOpenMobileSelector.options}
						value={direction}
						onClose={() => {
							setIsOpenMobileSelector({ open: false, options: [] });
						}}
						onSelect={(value) => {
							setDirection(value);
							setIsOpenMobileSelector({ open: false, options: [] });
						}}
					/>

					<DepartureListDialog
						departures={departures}
						isOpen={isOpenShowMore}
						onClose={() => setIsOpenShowMore(false)}
						direction={direction}
					/>
				</StationContext>
			</LineContext>
		</>
	);
}

export { LineContext, StationContext };
export default DepartureCard;
