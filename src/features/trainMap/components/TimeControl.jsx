import { Slider, Stack, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import React from 'react';
import { CompactButton, CompactInput } from '../../../components/Compact';

export function TimeControl({ state, setter }) {
	const [displayTime, setDisplayTime] = React.useState(0)
	const [isEditing, setIsEditing] = React.useState(false)
	const changeTime = second => {
		const newState = {
			...state,
			startAt: performance.now(),
			baseSimulationTime: second,
		}
		setter(newState)
		setDisplayTime((newState.baseSimulationTime + (performance.now() - newState.startAt) * newState.speedRate / 1000) % (60 * 60 * 24))
	}
	const changeSpeed = rate => {
		const number = Number.isNaN(Number(rate)) ? 1 : Number(rate)
		setter({
			startAt: performance.now(),
			baseSimulationTime: state.baseSimulationTime + (performance.now() - state.startAt) * state.speedRate / 1000,
			speedRate: number
		})
	}
	React.useEffect(() => {
		if (isEditing) {
			return
		}
		const id = setInterval(() => {
			setDisplayTime((state.baseSimulationTime + (performance.now() - state.startAt) * state.speedRate / 1000) % (60 * 60 * 24))
		}, 1000 / 24);
		return () => clearInterval(id)
	}, [state, isEditing])
	return (
		<Stack spacing={1}>
			<Stack direction='row'>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<TimePicker
						ampm={false}
						views={['hours', 'minutes', 'seconds']}
						value={dayjs().set('hour', Math.floor(displayTime / 3600)).set('minute', Math.floor((displayTime % 3600) / 60)).set('second', Math.floor(displayTime % 60))}
						onChange={d => changeTime(d.hour() * 3600 + d.minute() * 60 + d.second())}
						onOpen={() => setIsEditing(true)}
						onClose={() => setIsEditing(false)}
					></TimePicker>
				</LocalizationProvider>
			</Stack>
			<Slider
				size='small'
				valueLabelDisplay='off'
				min={0}
				max={60 * 60 * 24}
				marks={new Array(24).fill(0).map((_, i) => ({
					value: i * 60 * 60,
					label: ''
				}))}
				value={displayTime}
				onChange={(_, value) => changeTime(value)}
			></Slider>
			<Stack direction='row' justifyContent='center' spacing={1}>
				<Typography sx={{ whiteSpace: 'nowrap' }}>速度</Typography>
				<CompactButton size='small' variant='outlined' onClick={() => changeSpeed(state.speedRate - 10)}>-10</CompactButton>
				<CompactButton size='small' variant='outlined' onClick={() => changeSpeed(state.speedRate - 1)}>-1</CompactButton>
				<CompactInput
					size='small'
					variant='filled'
					sx={{ width: '3rem' }}
					value={state.speedRate}
					onChange={e => changeSpeed(e.target.value)}
					inputMode='numeric'
				></CompactInput>
				<CompactButton size='small' variant='outlined' onClick={() => changeSpeed(state.speedRate + 1)}>+1</CompactButton>
				<CompactButton size='small' variant='outlined' onClick={() => changeSpeed(state.speedRate + 10)}>+10</CompactButton>
			</Stack>
		</Stack>
	)
}
