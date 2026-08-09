import React from 'react';

import dayjs from 'dayjs';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Card,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	Tabs,
	Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import SaveDataImportButton from '../components/ImportLogButton';
import { exportSaveData } from '../utils/logDataManager';
import { id } from '../utils/Station.js';

import lines from '../data/lines.json';
import stations from '../data/stations.json';

const subwayLines = Object.values(lines).filter((line) => line.type === 'subway');
const cities = Array.from(new Set(Object.values(stations).map((station) => station.city)));
const numOfStations = Object.keys(stations).length;

function TabPanel(props) {
	const { children, value, index, ...other } = props;
	return (
		<Box role='tabpanel' hidden={value !== index} {...other}>
			{children}
		</Box>
	);
}

function getLatestVisitTime(stationId, logs) {
	return [...logs].sort((log1, log2) => log2.time - log1.time).find((log) => log.id === stationId)?.time;
}

function StationGroupAccordion({ title, stationIds, logs }) {
	const [order, setOrder] = React.useState('asc');
	const [orderBy, setOrderBy] = React.useState(-1);

	const handleRequestSort = (event, property) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const stationList = React.useMemo(() => {
		return Array.isArray(stationIds) ? stationIds : [...stationIds];
	}, [stationIds]);
	const sortedStationList = React.useMemo(() => {
		if (orderBy === 0) {
			return [...stationList].sort((a, b) => {
				const aName = stations[a]?.kana ?? '';
				const bName = stations[b]?.kana ?? '';
				if (order === 'asc') return aName.localeCompare(bName);
				else if (order === 'desc') return bName.localeCompare(aName);
			});
		} else if (orderBy === 1) {
			return [...stationList].sort((a, b) => {
				const aTime = getLatestVisitTime(a, logs) ?? 0;
				const bTime = getLatestVisitTime(b, logs) ?? 0;
				if (order === 'asc') return bTime - aTime;
				else if (order === 'desc') return aTime - bTime;
			});
		} else if (orderBy === 2) {
			return [...stationList].sort((a, b) => {
				const aCount = logs.filter((log) => log.id === a).length;
				const bCount = logs.filter((log) => log.id === b).length;
				if (order === 'asc') return bCount - aCount;
				else if (order === 'desc') return aCount - bCount;
			});
		} else return stationList;
	}, [stationList, order, orderBy]);
	const visitedStationIds = React.useMemo(() => {
		return new Set(logs.filter((log) => stationList.includes(log.id)).map((log) => log.id));
	}, [logs, stationList]);

	const HeaderCell = ({ index, label }) => (
		<TableCell>
			<TableSortLabel
				active={orderBy === index}
				direction={orderBy === index ? order : 'asc'}
				onClick={(event) => handleRequestSort(event, index)}
			>
				{label}
				{orderBy === index ?
					<Box component='span' sx={visuallyHidden}>
						{order === 'desc' ? 'sorted descending' : 'sorted ascending'}
					</Box>
				:	null}
			</TableSortLabel>
		</TableCell>
	);

	return (
		<Accordion key={title}>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Box
					sx={{
						width: '100%',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Typography variant='subtitle1'>{title}</Typography>
					<Typography variant='body1'>{`訪問済: ${visitedStationIds.size} 駅 / ${stationList.length} 駅`}</Typography>
				</Box>
			</AccordionSummary>
			<AccordionDetails>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<HeaderCell index={0} label='駅' />
								<HeaderCell index={1} label='最終訪問' />
								<HeaderCell index={2} label='訪問回数' />
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedStationList.map((stationId) => {
								const visitCount = logs.filter((log) => log.id === stationId).length;
								const latestVisitTime = getLatestVisitTime(stationId, logs);

								return (
									<TableRow key={`${title}${stationId}`}>
										<TableCell>{stations[stationId].name}</TableCell>
										<TableCell>{latestVisitTime ? dayjs(latestVisitTime).format('YYYY/MM/DD HH:mm') : '未訪問'}</TableCell>
										<TableCell>{`${visitCount} 回`}</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</AccordionDetails>
		</Accordion>
	);
}

export default function Log() {
	const [mode, setMode] = React.useState(0);

	const logs = React.useMemo(() => JSON.parse(localStorage.getItem('visitedStations') || '[]').toReversed(), []);
	const checkedStations = React.useMemo(() => {
		return new Set(logs.map((log) => log.id)).size;
	}, [logs]);

	const lastExportedDate = React.useMemo(() => localStorage.getItem('lastExport') ?? null, []);

	const handleLoadSuccess = (loadedData) => {
		if (localStorage.getItem('visitedStations')) {
			if (!window.confirm('現在の訪問履歴は上書きされます。よろしいですか？')) {
				return;
			}
		}
		const transformedData = loadedData.map((log) => ({
			id: log.id ?? id(log.name),
			time: log.time,
		}));
		localStorage.setItem('visitedStations', JSON.stringify(transformedData));
		window.location.reload();
	};

	return (
		<Box sx={{ width: { xs: '100%', md: '70%' }, mx: 'auto', my: 4, p: 2 }}>
			<Typography variant='h6'>駅ログ！</Typography>
			<Typography variant='body1' sx={{ mt: 1 }}>
				station logs!
			</Typography>
			<Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
				<Typography variant='body1' sx={{ mt: 1 }}>
					{`訪問済: ${checkedStations}駅 / ${numOfStations}駅 ${((checkedStations / numOfStations) * 100).toFixed(2)}%`}
				</Typography>
			</Box>
			<Box>
				<Tabs value={mode} onChange={(_, v) => setMode(v)} variant='scrollable'>
					<Tab label='履歴一覧' value={0} />
					<Tab label='路線別' value={1} />
					<Tab label='市町村別' value={2} />
					<Tab label='データ管理' value={3} />
				</Tabs>
			</Box>
			<TabPanel value={mode} index={0}>
				<Card sx={{ width: '100%', overflow: 'auto', mx: 'auto', my: 4, p: 2 }}>
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell />
									<TableCell>タイムスタンプ</TableCell>
									<TableCell>駅</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{logs.map((log, i) => (
									<TableRow key={`${i}-${log.time}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
										<TableCell>
											{logs.findLastIndex((l) => l.id === log.id) === i && <Typography color='red'>新</Typography>}
										</TableCell>
										<TableCell>
											<Typography>{dayjs(log.time).format('YYYY/MM/DD HH:mm')}</Typography>
										</TableCell>
										<TableCell>{stations[log.id]?.name}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Card>
			</TabPanel>
			<TabPanel value={mode} index={1}>
				<Card sx={{ width: '100%', overflow: 'auto', mx: 'auto', my: 4, p: 2 }}>
					{subwayLines.map((line) => {
						const innerStations = new Set(line.stations[0].id ? line.stations.map((sta) => sta.id) : line.stations);
						return <StationGroupAccordion key={line.name} title={line.name} stationIds={innerStations} logs={logs} />;
					})}
				</Card>
			</TabPanel>
			<TabPanel value={mode} index={2}>
				<Card sx={{ width: '100%', overflow: 'auto', mx: 'auto', my: 4, p: 2 }}>
					{cities
						.sort(
							(a, b) =>
								Object.values(stations).filter((s) => s.city === b).length -
								Object.values(stations).filter((s) => s.city === a).length,
						)
						.map((city) => {
							const innerStations = Object.values(stations)
								.filter((station) => station.city === city)
								.map((station) => station.id);
							return <StationGroupAccordion key={city} title={city} stationIds={innerStations} logs={logs} />;
						})}
				</Card>
			</TabPanel>
			<TabPanel value={mode} index={3}>
				<Card sx={{ width: '100%', overflow: 'auto', mx: 'auto', my: 4, p: 2 }}>
					<Typography variant='h6'>データ管理</Typography>
					<Typography variant='body1' sx={{ mt: 2 }}>
						データのエクスポート・インポートができます。
						<br />
						エクスポートは現在の訪問履歴を保存し、インポートは保存したファイルから訪問履歴を復元します。
						<br />
						※インポートするファイルはエクスポートしたものを使用してください。
						<br />
						最終エクスポート日時: {lastExportedDate ? dayjs(lastExportedDate).format('YYYY/MM/DD HH:mm') : 'なし'}
					</Typography>
					<Stack direction='row' spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
						<Button variant='contained' sx={{ mt: 2 }} onClick={() => exportSaveData(logs)}>
							エクスポート
						</Button>
						<SaveDataImportButton onLoadSuccess={handleLoadSuccess} />
					</Stack>
				</Card>
			</TabPanel>
		</Box>
	);
}
