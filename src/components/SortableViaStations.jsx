import React from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import SettingsIcon from '@mui/icons-material/Settings';
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	Paper,
	Slider,
	Stack,
	Typography,
} from '@mui/material';

import StationSelecter, { StationSelectButtons, toSelecterOption } from './StationSelecter.jsx';

const timeValues = [0.5, 1, 5, 10, 15, 20, 30, 40, 50, 60];
const scale = (i) => timeValues[i];

const marks = timeValues.map((value, index) => ({
	value: index,
	label: value.toString(),
}));

export default function SortableViaStations({ handleChange, handleDelete, disabledStations, id, value, options }) {
	const [timeIndex, setTimeIndex] = React.useState(options.stayingTime ? timeValues.indexOf(options.stayingTime) : 3);
	const [openDialog, setOpenDialog] = React.useState(false);

	const { setNodeRef, attributes, listeners, transform, transition, isDragging, setActivatorNodeRef } = useSortable({
		id,
	});

	const handleCloseDialog = () => {
		setOpenDialog(false);
		handleChange({ value, options });
	};

	return (
		<>
			<div
				ref={setNodeRef}
				style={{
					transform: CSS.Transform.toString(transform),
					transition,
				}}
			>
				<Stack direction='row' spacing={1} sx={{ alignItems: 'center', width: '100%', opacity: isDragging ? 0 : 1 }}>
					<Stack spacing={0.5} sx={{ width: '100%' }}>
						<StationSelecter
							onChange={(v) => {
								handleChange({ value: v, options });
							}}
							value={value}
							placeholder={`経由駅を選択`}
							disabledStations={disabledStations}
						/>
						<StationSelectButtons
							disabledStations={disabledStations}
							onSelect={(v) => {
								const newValue = toSelecterOption(v);
								handleChange({ value: newValue, options });
							}}
						/>
					</Stack>
					<IconButton aria-label='オプション' onClick={() => setOpenDialog(true)} sx={{ alignSelf: 'center' }}>
						<SettingsIcon />
					</IconButton>
					<IconButton aria-label='削除' onClick={handleDelete} sx={{ alignSelf: 'center' }}>
						<DeleteIcon />
					</IconButton>
					<IconButton
						aria-label='ドラッグ'
						sx={{ alignSelf: 'center', cursor: 'grab', touchAction: 'none' }}
						ref={setActivatorNodeRef}
						{...attributes}
						{...listeners}
					>
						<DragHandleIcon sx={{ alignSelf: 'center', cursor: 'grab' }} />
					</IconButton>
				</Stack>
			</div>
			<Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
				<DialogTitle>経由駅オプション({value?.label ?? '駅が選択されていません'})</DialogTitle>
				<DialogContent>
					<Stack spacing={2}>
						<Typography variant='body2' color='text.secondary'>
							<FormControlLabel
								control={<Checkbox />}
								onChange={(e) =>
									handleChange({
										value,
										options: { ...options, exitGate: e.target.checked },
									})
								}
								checked={options.exitGate}
								label='改札外へ出る'
							/>
						</Typography>
						<Stack>
							<Typography variant='body2' color='text.secondary'>
								滞在時間(分)
							</Typography>
							<Slider
								value={timeIndex}
								onChange={(_, v) => {
									setTimeIndex(v);
									handleChange({
										value,
										options: { ...options, stayingTime: scale(v) },
									});
								}}
								defaultValue={3}
								valueLabelDisplay='auto'
								step={1}
								marks
								min={0}
								max={timeValues.length - 1}
								scale={scale}
							/>
						</Stack>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog}>閉じる</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export function DraggingItem({ label }) {
	return (
		<Paper elevation={3} sx={{ p: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
			<Stack direction='row' sx={{ alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
				<Typography variant='subtitle1'>{label}</Typography>
				<DragHandleIcon sx={{ alignSelf: 'center' }} />
			</Stack>
		</Paper>
	);
}
