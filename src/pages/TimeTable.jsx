import React from 'react';

import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Paper,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	Tabs,
	Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import '@offlegacy/nuqs-hash-router';
import { useAtomValue } from 'jotai';
import { parseAsInteger, useQueryState } from 'nuqs';

import { settingsAtom } from '../atom/atom.js';
import StationSelecter, { StationSelectButtons } from '../components/StationSelecter.jsx';
import TrainStopsDialog from '../components/TrainStopsDialog.jsx';
import getDirections from '../utils/getDirections.js';

import stations from '../data/stations.json';
import typesData from '../data/types.json';

import { getDeparture } from '../utils/readOud.js';
import { label } from '../utils/Station.js';

function TimeTable() {
	const [station, setStation] = useQueryState('station');
	const [direction, setDirection] = useQueryState('direction', parseAsInteger.withDefault(0));

	const [departures, setDepartures] = React.useState([]);
	const [loading, setLoading] = React.useState(false);

	const [filteredTypes, setFilteredTypes] = React.useState([]);

	const [pushed, setPushed] = React.useState(null);
	const [isShowDialog, setIsShowDialog] = React.useState(false);

	const theme = useTheme();
	const typeColorMode =
		theme.palette.mode === 'dark' && useAtomValue(settingsAtom).general.changeTypeColorInDarkToLight ? 'light' : theme.palette.mode;

	const directionOptions = React.useMemo(() => getDirections(station), [station]);

	function divideDeps(deps) {
		let result = [];
		for (const dep of deps) {
			let hour = Math.floor(dep.time / 3600) % 24;
			if (hour < 3) hour += 24;
			const min = Math.floor((dep.time % 3600) / 60);
			result[hour] ??= [];
			result[hour].push({ ...dep, min });
		}
		result.forEach((deps) => deps.sort((a, b) => a.time - b.time));
		return result;
	}

	React.useEffect(() => {
		if (!station) return;
		const desiredDirection = 0; // directionOptions[direction] ? direction : 0;
		if (desiredDirection !== direction) {
			setDirection(desiredDirection);
		}
		setLoading(true);
		getDeparture(station, directionOptions[desiredDirection]).then((deps) => {
			setDepartures(divideDeps(deps));
			setLoading(false);
		});
	}, [station]);

	React.useEffect(() => {
		if (station && directionOptions[direction]) {
			setLoading(true);
			getDeparture(station, directionOptions[direction])
				.then((deps) => setDepartures(divideDeps(deps)))
				.catch(() => {
					setDepartures([]);
					alert('エラーが発生しました\nもう一度お試しください');
				})
				.finally(() => setLoading(false));
		}
	}, [direction]);

	const { terminalLabels, terminalEntries, containedTypes } = React.useMemo(() => {
		const terminalCounts = {};
		const getTerminalParts = (terminal) => {
			if (terminal.includes('・')) return terminal.split('・');
			if (terminal.includes('経由')) return terminal.split('経由');
			return [terminal];
		};
		const getShortNameCandidates = (terminal) => {
			let letters = terminal.replace(/新|(三河)/, '');
			if (terminal.includes('大府環状線')) letters = '環';
			if (terminal.includes('中部国際空港')) letters = '空';
			return letters;
		};

		let containedTypes = new Set();
		for (const deps of departures) {
			if (!deps) continue;
			for (const dep of deps) {
				containedTypes.add(dep.typeName);
				for (const terminal of getTerminalParts(dep.terminal)) {
					terminalCounts[terminal] = (terminalCounts[terminal] ?? 0) + 1;
				}
			}
		}

		const terminalMap = {};
		const usedLetters = {};
		const terminalShortNames = {};
		const addTerminalShortName = (terminal) => {
			if (terminalShortNames[terminal]) return terminalShortNames[terminal];

			const letters = getShortNameCandidates(terminal);

			for (const letter of letters) {
				if (!usedLetters[letter]) {
					usedLetters[letter] = terminal;
					terminalShortNames[terminal] = letter;
					terminalMap[letter] = { label: terminal, count: terminalCounts[terminal] };
					return letter;
				}
			}
			return terminal;
		};

		Object.keys(terminalCounts)
			.sort((a, b) => terminalCounts[b] - terminalCounts[a])
			.forEach(addTerminalShortName);

		const labels = departures.map((deps) =>
			deps.map((dep) => {
				if (dep.terminal.includes('・')) {
					return dep.terminal.split('・').map(addTerminalShortName).join('・');
				}
				if (dep.terminal.includes('経由')) {
					return dep.terminal.split('経由').map(addTerminalShortName).toReversed().join('(') + ')';
				}
				return addTerminalShortName(dep.terminal);
			}),
		);

		return {
			terminalLabels: labels,
			terminalEntries: Object.entries(terminalMap),
			containedTypes: Array.from(containedTypes),
		};
	}, [departures]);

	return (
		<>
			<Typography variant='h6'>時刻表</Typography>
			<Stack sx={{ mt: 2 }} spacing={2}>
				<StationSelecter
					value={
						station ?
							{
								value: station,
								label: stations[station]?.name,
								kana: stations[station]?.kana,
							}
						:	null
					}
					placeholder={'駅を選択'}
					onChange={(value) => setStation(value.value)}
				/>
				<StationSelectButtons onSelect={(station) => setStation(station)} />
				<Stack sx={{ width: '100%', px: 'auto' }}>
					<Tabs
						value={direction}
						onChange={(_, v) => setDirection(v)}
						variant='scrollable'
						scrollButtons='auto'
						allowScrollButtonsMobile
						sx={{
							'& .MuiTabs-flexContainer': {
								justifyContent: 'center',
							},
							'& .MuiTabs-scroller': {
								overflowX: 'auto',
							},
						}}
					>
						{directionOptions.map((direction, i) => (
							<Tab label={`${label(direction.id)} 方面`} key={i} />
						))}
					</Tabs>
				</Stack>
			</Stack>

			<Stack sx={{ mt: 2 }} direction='row' justifyContent='left' gap={1} flexWrap='wrap' useFlexGap>
				{Object.entries(typesData)
					.filter(([typeName]) => containedTypes.includes(typeName))
					.map(([typeName, { color }], i) => (
						<Chip
							label={typeName}
							onClick={() => {
								if (filteredTypes.length === 0) {
									setFilteredTypes(containedTypes.filter((t) => t !== typeName));
								} else if (filteredTypes.includes(typeName)) {
									setFilteredTypes(filteredTypes.filter((t) => t !== typeName));
								} else if (filteredTypes.length === containedTypes.length - 1) {
									setFilteredTypes([]);
								}
							}}
							onDoubleClick={() => {
								if (filteredTypes.length === 0) {
									setFilteredTypes([...filteredTypes, typeName]);
								} else {
									setFilteredTypes([]);
								}
							}}
							sx={{
								color: typeColorMode === 'light' ? '#fff' : '#000',
								backgroundColor: filteredTypes.includes(typeName) ? 'gray' : color[theme.palette.mode],
							}}
							key={i}
						/>
					))}
			</Stack>

			<TableContainer sx={{ mt: 2, borderRadius: 0 }} component={Paper}>
				<Table>
					<colgroup>
						<col style={{ width: '5%' }} />
						<col style={{ width: '95%' }} />
					</colgroup>

					<TableBody>
						{loading ?
							<TableRow>
								<TableCell colSpan={2} sx={{ textAlign: 'center' }}>
									<CircularProgress />
								</TableCell>
							</TableRow>
						:	departures.map((deps, i) => (
								<TableRow
									key={i}
									sx={{
										width: '100%',
										p: 0,
										overflowX: 'auto',
										backgroundColor:
											i % 2 === 0 ? theme.palette.background.default
											: theme.palette.mode === 'light' ? '#DDD'
											: '#333',
										display: i < 3 || deps.length === 0 ? 'none' : '',
									}}
								>
									<TableCell
										sx={{
											textAlign: 'right',
											backgroundColor:
												i % 2 === 0 ? theme.palette.background.default
												: theme.palette.mode === 'light' ? '#DDD'
												: '#333',
											borderRight: '1px solid #ccc',
											position: 'sticky',
											zIndex: 2,
											left: 0,
										}}
									>
										<Typography variant='h5'>{i}</Typography>
									</TableCell>
									<TableCell sx={{ p: 0 }}>
										<Stack direction='row' gap={0}>
											{deps.map((dep, j) => {
												const strong = dep.typeName === '特急';
												const frame = dep.typeName === 'ライナー' || dep.typeName === '各駅停車';
												if (filteredTypes.includes(dep.typeName)) return null;
												return (
													<Button
														onClick={() => {
															setPushed(dep);
															setIsShowDialog(true);
														}}
														sx={{
															p: 0,
															mx: 0.4,
															borderRadius: 0,
															width: 42,
															minWidth: 42,
														}}
														key={`${i}-${j}`}
													>
														<Box sx={{ flex: '0 0 39px' }}>
															<Box
																sx={{
																	background: strong ? typesData[dep.typeName]?.color[typeColorMode] : '',
																	border: frame ? `1px solid ${typesData[dep.typeName]?.color[typeColorMode]}` : '',
																}}
															>
																<Typography
																	color={strong ? 'white' : typesData[dep.typeName]?.color[typeColorMode]}
																	variant='h6'
																>
																	{String(dep.min).padStart(2, '0')}
																</Typography>
															</Box>
															<Typography
																color={typesData[dep.typeName]?.color[typeColorMode]}
																sx={{ whiteSpace: 'nowrap' }}
																variant='body6'
															>
																{terminalLabels[i][j]}
															</Typography>
														</Box>
													</Button>
												);
											})}
										</Stack>
									</TableCell>
								</TableRow>
							))
						}
					</TableBody>
				</Table>
			</TableContainer>
			{!loading && departures.length !== 0 && (
				<Stack sx={{ mt: 2 }} direction='row' justifyContent='left' gap={2} flexWrap='wrap' useFlexGap>
					{terminalEntries.map(([letter, { label: terminal }], i) => (
						<Typography variant='body1' key={i}>
							{letter}: {terminal}
						</Typography>
					))}
				</Stack>
			)}

			{pushed && isShowDialog && (
				<TrainStopsDialog
					dep={pushed}
					line={directionOptions[direction]?.line}
					isShowDialog={isShowDialog}
					onClose={() => {
						setIsShowDialog(false);
						setPushed(null);
					}}
					emphasized={[station]}
				/>
			)}
		</>
	);
}

export default TimeTable;
