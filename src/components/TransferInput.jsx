import React from 'react';

import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';

import SettingsIcon from '@mui/icons-material/Settings';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	Slider,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useAtom, useAtomValue } from 'jotai';

import StationSelecter, { StationSelectButtons } from './StationSelecter.jsx';

import { resultAtom, settingsAtom } from '../utils/Atom.js';

import stations from '../data/stations.json';

export default function TransferInput({ onSearch, loading }) {
	const { search } = useLocation();
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [result, setResult] = useAtom(resultAtom);

	const [options, setOptions] = React.useState({
		from: null,
		to: null,
		timeType: 'departure',
		time: dayjs(),
		tokkyu: false,
		allowOuterTransfer: true,
		transferTime: 30,
	});

	const [openOption, setOpenOption] = React.useState(false);

	const showSeconds = useAtomValue(settingsAtom).showSeconds;

	const toSeconds = (time) => {
		if (!dayjs.isDayjs(time)) return time;
		return Number(time.format('HH')) * 3600 + Number(time.format('mm')) * 60 + Number(time.format('ss'));
	};

	const toSelecterOption = (id) => {
		const stationName = stations[id]?.name;
		if (!stationName) return null;
		return { label: stationName, value: id, kana: stations[id]?.kana || '' };
	};

	const writeQuery = (options) => {
		const params = new URLSearchParams();
		params.set(
			'p',
			options.from.value +
				options.timeType[0] +
				String(toSeconds(options.time)).padStart(5, 0) +
				String(options.transferTime).padStart(2, 0) +
				(options.tokkyu ? 't' : 'f') +
				(options.allowOuterTransfer ? 't' : 'f') +
				options.to.value,
		);
		navigate(`/transfer?${params.toString()}`);
	};

	const readQuery = (p) => {
		const timeTypes = {
			d: 'departure',
			a: 'arrival',
			f: 'first',
			l: 'last',
		};

		if (!p) return null;

		const from = toSelecterOption(p.slice(0, 3));
		const timeType = timeTypes[p.slice(3, 4)];
		const time = dayjs()
			.startOf('day')
			.add(Number(p.slice(4, 9)), 'second');
		const transferTime = Number(p.slice(9, 11));
		const tokkyu = p.slice(11, 12) === 't';
		const allowOuterTransfer = p.slice(12, 13) === 't';
		const to = toSelecterOption(p.slice(13, 16));

		return { from, to, timeType, time, tokkyu, allowOuterTransfer, transferTime };
	};

	React.useEffect(() => {
		if (sessionStorage.getItem('lastSearch')) {
			const lastSearch = JSON.parse(sessionStorage.getItem('lastSearch'));

			setOptions({
				...options,
				from: lastSearch.from,
				to: lastSearch.to,
				time: dayjs().startOf('day').add(lastSearch.time, 'second'),
				timeType: lastSearch.timeType,
				transferTime: lastSearch.transferTime,
				tokkyu: lastSearch.tokkyu,
				allowOuterTransfer: lastSearch.allowOuterTransfer,
			});

			writeQuery(lastSearch);
			setResult(lastSearch.result);

			if (!!lastSearch.result && Object.keys(lastSearch.result).length > 0) return;
		}

		const query = new URLSearchParams(search);
		const newOptions = readQuery(query.get('p'));
		if (!newOptions) return;

		setOptions({
			...options,
			...newOptions,
		});

		handleSearch({
			...options,
			...newOptions,
		});
	}, []);

	const handleSearch = (options) => {
		let mode;
		let t = toSeconds(options.time);
		if (options.timeType === 'departure') mode = 0;
		else if (options.timeType === 'arrival') mode = 1;
		else if (options.timeType === 'first') {
			mode = 0;
			t = 10800;
		} else if (options.timeType === 'last') {
			mode = 1;
			t = 10799;
		}

		writeQuery(options);

		onSearch(options.from?.value, options.to?.value, t, mode, options.transferTime, options.tokkyu, options.allowOuterTransfer);
		sessionStorage.setItem(
			'lastSearch',
			JSON.stringify({
				...options,
				time: t,
			}),
		);
	};

	const handleSwap = () => {
		setOptions({
			...options,
			from: options.to,
			to: options.from,
		});
	};

	return (
		<Box
			sx={{
				maxWidth: 720,
				mx: 'auto',
				p: isMobile ? 2 : 3,
			}}
		>
			<Typography variant='h6' sx={{ mb: 2 }}>
				乗換案内
			</Typography>

			{/* 出発・到着 */}
			<Stack direction='row' spacing={1} alignItems='center'>
				<Stack flexGrow={1} spacing={2.5}>
					<Stack spacing={0.5}>
						<StationSelecter
							onChange={(value) =>
								setOptions({
									...options,
									from: value,
								})
							}
							value={options.from}
							placeholder='出発駅を選択'
							disabledStations={[options.to?.value]}
						/>
						<StationSelectButtons
							disabledStations={[options.to?.value]}
							onSelect={(value) =>
								setOptions({
									...options,
									from: {
										value: value,
										label: stations[value].name,
										kana: stations[value].kana,
									},
								})
							}
						/>
					</Stack>
					<Stack spacing={0.5}>
						<StationSelecter
							onChange={(value) => setOptions({ ...options, to: value })}
							value={options.to}
							placeholder='到着駅を選択'
							disabledStations={[options.from?.value]}
						/>
						<StationSelectButtons
							disabledStations={[options.from?.value]}
							onSelect={(value) =>
								setOptions({
									...options,
									to: {
										value: value,
										label: stations[value].name,
										kana: stations[value].kana,
									},
								})
							}
						/>
					</Stack>
				</Stack>
				<IconButton aria-label='入れ替え' onClick={handleSwap} sx={{ alignSelf: 'center' }}>
					<SwapVertIcon />
				</IconButton>
			</Stack>

			{/* 時刻設定 */}
			<Box sx={{ mt: { xs: 2, md: 3 } }}>
				<ToggleButtonGroup
					value={options.timeType}
					exclusive
					onChange={(_, v) => v && setOptions({ ...options, timeType: v })}
					size={isMobile ? 'small' : 'medium'}
					fullWidth
				>
					<ToggleButton value='departure'>出発</ToggleButton>
					<ToggleButton value='arrival'>到着</ToggleButton>
					<ToggleButton value='first'>初電</ToggleButton>
					<ToggleButton value='last'>終電</ToggleButton>
				</ToggleButtonGroup>

				<Box sx={{ mt: { xs: 1, md: 2 }, display: { xs: 'block', md: 'flex' }, gap: 1 }}>
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<TimePicker
							label='時刻を選択'
							value={options?.time}
							onChange={(newValue) =>
								setOptions({
									...options,
									time: newValue,
								})
							}
							ampm={false}
							slotProps={{
								textField: {
									fullWidth: true,
									sx: { mt: 2 },
								},
							}}
							fullWidth
							format={!showSeconds ? 'HH:mm' : 'HH:mm:ss'}
							sx={{ mt: 2 }}
							disabled={options.timeType !== 'departure' && options.timeType !== 'arrival'}
						/>
					</LocalizationProvider>
					<Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
						<Button
							size={isMobile ? 'small' : 'medium'}
							sx={{ whiteSpace: 'nowrap' }}
							onClick={() => setOptions({ ...options, time: dayjs().subtract(5, 'minute') })}
							disabled={options.timeType !== 'departure' && options.timeType !== 'arrival'}
						>
							5分前
						</Button>
						<Button
							size={isMobile ? 'small' : 'medium'}
							sx={{ whiteSpace: 'nowrap' }}
							onClick={() => setOptions({ ...options, time: dayjs() })}
							disabled={options.timeType !== 'departure' && options.timeType !== 'arrival'}
						>
							現在時刻
						</Button>
						<Button
							size={isMobile ? 'small' : 'medium'}
							sx={{ whiteSpace: 'nowrap' }}
							onClick={() => setOptions({ ...options, time: dayjs().add(5, 'minute') })}
							disabled={options.timeType !== 'departure' && options.timeType !== 'arrival'}
						>
							5分後
						</Button>
					</Box>
				</Box>
			</Box>

			{/* オプション */}
			<Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
				<Button startIcon={<SettingsIcon />} onClick={() => setOpenOption(true)} sx={{ px: 2, whiteSpace: 'nowrap', width: 'fit-content' }}>
					オプション
				</Button>

				<Button
					onClick={() => handleSearch(options)}
					disabled={!options.from || !options.to}
					variant='contained'
					size={isMobile ? 'medium' : 'large'}
					loading={loading}
					fullWidth
				>
					検索
				</Button>
			</Box>

			{/* オプションダイアログ */}
			<Dialog open={openOption} onClose={() => setOpenOption(false)} fullWidth>
				<DialogTitle>検索オプション</DialogTitle>
				<DialogContent dividers>
					{/* ここに後からオプションを追加しやすい構造 */}
					<Stack spacing={2}>
						<Typography variant='body2' color='text.secondary'>
							<FormControlLabel
								control={<Checkbox />}
								onChange={(e) => setOptions({ ...options, tokkyu: e.target.checked })}
								checked={options.tokkyu}
								label='有料列車を利用する'
							/>
						</Typography>
						<Typography variant='body2' color='text.secondary'>
							<FormControlLabel
								control={<Checkbox />}
								onChange={(e) => setOptions({ ...options, allowOuterTransfer: !e.target.checked })}
								checked={!options.allowOuterTransfer}
								label='改札外乗り換えを許可しない'
							/>
						</Typography>
						<Stack>
							<Typography variant='body2' color='text.secondary'>
								乗り換え時間(秒)
							</Typography>
							<Slider
								value={options.transferTime}
								onChange={(_, v) => setOptions({ ...options, transferTime: v })}
								defaultValue={30}
								valueLabelDisplay='auto'
								shiftStep={30}
								step={15}
								marks
								min={15}
								max={120}
							/>
						</Stack>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenOption(false)}>閉じる</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
