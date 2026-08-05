import React from 'react';

import { Button, Menu, MenuItem, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtomValue } from 'jotai';
import Select from 'react-select';

import { myStationsAtom, nearestStationAtom } from '../utils/Atom.js';
import { id } from '../utils/Station.js';

import stations from '../data/stations.json';

export default function StationSelecter({ ref, value, placeholder, onChange, autoFocus = false, disabledStations = [], station = true }) {
	const theme = useTheme();

	let options = [];
	if (station)
		options.push(
			...Object.keys(stations).map((id) => ({
				value: id,
				label: stations[id].name,
				kana: stations[id].kana,
			})),
		);

	if (disabledStations.length) {
		options = options.filter((station) => !disabledStations.includes(station.value));
	}

	const onSelect = (option) => {
		const history = JSON.parse(window.localStorage.getItem('stationHistory'))?.toReversed() || [];
		let newHistory;
		if (!stations[history[0]]) newHistory = history.map(id).filter((id) => id !== option.value);
		else newHistory = history.filter((id) => id !== option.value);
		newHistory.unshift(option.value);
		window.localStorage.setItem('stationHistory', JSON.stringify(newHistory.toReversed()));
		onChange(option);
	};

	const history = JSON.parse(window.localStorage.getItem('stationHistory')) || [];
	const sortedOptions = options
		.slice()
		.sort((a, b) => a.kana.localeCompare(b.kana))
		.sort((a, b) => history.indexOf(b.value) - history.indexOf(a.value));

	return (
		<Select
			ref={ref}
			options={sortedOptions}
			onChange={onSelect}
			value={value}
			placeholder={placeholder ?? '駅・バス停を検索'}
			isSearchable={true}
			autoFocus={autoFocus}
			menuPortalTarget={document.body}
			styles={{
				menuPortal: (base) => ({ ...base, zIndex: 10001 }),
				control: (provided) => ({
					...provided,
					backgroundColor: theme.palette.background.paper, // MUIの紙の背景色
					color: theme.palette.text.primary, // MUIのメイン文字色
					borderColor: theme.palette.divider, // MUIの区切り線色
					'&:hover': {
						borderColor: theme.palette.primary.main, // ホバー時はMUIのプライマリ色
					},
				}),

				// 選択された値の表示部分
				singleValue: (provided) => ({
					...provided,
					color: theme.palette.text.primary,
				}),

				// ドロップダウンのコンテナ
				menu: (provided) => ({
					...provided,
					backgroundColor: theme.palette.background.paper,
				}),

				// ドロップダウン内の各選択肢
				option: (provided, state) => ({
					...provided,
					// 選択中・ホバー中・通常時で背景色を切り替え
					backgroundColor:
						state.isSelected ? theme.palette.primary.main
						: state.isFocused ? theme.palette.action.hover
						: 'transparent',
					// 選択中と通常時で文字色を切り替え
					color: state.isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
					'&:active': {
						backgroundColor: theme.palette.action.selected,
					},
				}),

				// 入力中のテキストのスタイル
				input: (provided) => ({
					...provided,
					color: theme.palette.text.primary,
				}),

				// プレースホルダー（未選択時の文字）
				placeholder: (provided) => ({
					...provided,
					color: theme.palette.text.secondary,
				}),
			}}
			formatOptionLabel={({ label }) => (
				<div style={{ display: 'flex', justifyContent: 'space-between' }}>
					<div>{label}</div>
				</div>
			)}
		/>
	);
}

export function StationSelectButtons({ onSelect, disabledStations = [] }) {
	const myStations = useAtomValue(myStationsAtom);
	const nearestStation = useAtomValue(nearestStationAtom);

	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);
	function handleClick(event) {
		setAnchorEl(event.currentTarget);
	}
	function handleClose(name) {
		setAnchorEl(null);
		if (typeof name === 'string') onSelect(name);
	}

	return (
		<Stack spacing={1} direction='row' gap={1}>
			<Button
				onClick={() => onSelect(nearestStation)}
				disabled={!nearestStation || disabledStations.includes(nearestStation)}
				size='small'
				variant='outlined'
				fullWidth
			>
				最寄り駅
			</Button>
			<Button onClick={handleClick} size='small' variant='outlined' fullWidth>
				マイ駅から選ぶ
			</Button>
			<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
				{myStations
					.filter((id) => !disabledStations.includes(id))
					.map((id) => (
						<MenuItem key={id} onClick={() => handleClose(id)}>
							{stations[id].name}
						</MenuItem>
					))}
			</Menu>
		</Stack>
	);
}

export const toSelecterOption = (id) => {
	const stationName = stations[id]?.name;
	if (!stationName) return null;
	return { label: stationName, value: id, kana: stations[id]?.kana || '' };
};
