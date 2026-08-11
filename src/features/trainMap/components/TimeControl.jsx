import SyncIcon from '@mui/icons-material/Sync';
import { IconButton, Slider, Stack, Tooltip, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { useAtom, useSetAtom } from 'jotai';
import React from 'react';
import { CompactButton, CompactInput } from '../../../components/Compact';
import { setSecondAtom, setSpeedAtom, syncRealTimeAtom, timeAtom } from '../states/time';

export function TimeControl() {
	const [timeState, setTimeState] = useAtom(timeAtom)
	const setSecond = useSetAtom(setSecondAtom)
	const setSpeed = useSetAtom(setSpeedAtom)
	const syncRealTime = useSetAtom(syncRealTimeAtom)
	const [displayTime, setDisplayTime] = React.useState(0)
	const [isEditing, setIsEditing] = React.useState(false)

	React.useEffect(() => {
		if (isEditing) {
			return
		}
		let id
		const tick = () => {
			setDisplayTime(Math.floor((timeState.baseSimulationTime + (performance.now() - timeState.startAt) * timeState.speedRate / 1000) % (60 * 60 * 24)))
			id = requestAnimationFrame(tick)
		}
		id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id)
	}, [timeState, isEditing])

	return (
		<Stack spacing={1}>
			<Stack direction='row' alignItems='center' spacing={1}>
				<Tooltip title='現実時間と同期'>
					<IconButton onClick={syncRealTime}>
						<SyncIcon></SyncIcon>
					</IconButton>
				</Tooltip>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<TimePicker
						sx={{
							width: '100%',
							'& .MuiPickersSectionList-root': {
								padding: '8px 0'
							}
						}}
						ampm={false}
						views={['hours', 'minutes', 'seconds']}
						value={dayjs().set('hour', Math.floor(displayTime / 3600)).set('minute', Math.floor((displayTime % 3600) / 60)).set('second', Math.floor(displayTime % 60))}
						onChange={d => setSecond(d.hour() * 3600 + d.minute() * 60 + d.second())}
						onOpen={() => setIsEditing(true)}
						onClose={() => setIsEditing(false)}
					></TimePicker>
				</LocalizationProvider>
			</Stack>
			<Slider
				size='small'
				valueLabelDisplay='off'
				sx={{
					'& .MuiSlider-thumb': {
						transition: 'none'
					},
					'& .MuiSlider-track': {
						transition: 'none'
					},
				}}
				min={0}
				max={60 * 60 * 24}
				marks={new Array(24).fill(0).map((_, i) => ({
					value: i * 60 * 60,
					label: ''
				}))}
				value={displayTime}
				onChange={(_, value) => setSecond(value)}
			></Slider>
			<Stack direction='row' justifyContent='center' spacing={1}>
				<Typography sx={{ whiteSpace: 'nowrap' }}>速度</Typography>
				<CompactButton size='small' variant='outlined' onClick={() => setSpeed(timeState.speedRate / 5)}>×0.25</CompactButton>
				<CompactButton size='small' variant='outlined' onClick={() => setSpeed(timeState.speedRate / 2)}>×0.5</CompactButton>
				<CompactInput
					size='small'
					variant='filled'
					sx={{ width: '3rem' }}
					inputMode='numeric'
					value={timeState.speedRate}
					onChange={e => {
						const rate = e.target.value
						const number = Number.isNaN(Number(rate)) ? 1 : Number(rate)
						setSpeed(number)
					}}
				></CompactInput>
				<CompactButton size='small' variant='outlined' onClick={() => setSpeed(timeState.speedRate * 2)}>×2</CompactButton>
				<CompactButton size='small' variant='outlined' onClick={() => setSpeed(timeState.speedRate * 5)}>×5</CompactButton>
			</Stack>
		</Stack>
	)
}
