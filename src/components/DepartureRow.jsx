import React from 'react';

import { Box, Chip, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtomValue } from 'jotai';

import OverflowMarquee from './OverflowMarquee.jsx';
import TrainStopsDialog from './TrainStopsDialog.jsx';

import { settingsAtom } from '../utils/Atom.js';
import { label } from '../utils/Station.js';
import { toTimeString } from '../utils/Time.js';

import types from '../data/types.json';

function DepartureRow({ dep, needId = false, station }) {
	const theme = useTheme();

	const [isShowDialog, setIsShowDialog] = React.useState(false);
	const showSeconds = useAtomValue(settingsAtom).general.showSeconds;
	const timeWidth = 42 * (!showSeconds ? 1 : 1.6);

	return (
		<>
			<Box
				id={needId ? String(dep.time) : null}
				sx={{
					borderBottom: `1px solid ${theme.palette.divider}`,
					py: '3px',
					cursor: 'pointer',
				}}
				onClick={() => {
					setIsShowDialog(true);
				}}
			>
				<Grid container wrap='nowrap' alignItems='center' columnGap={0.5}>
					{/* 種別 */}
					<Grid sx={{ flex: '0 0 auto' }}>
						<Chip
							label={dep.typeName}
							size='small'
							sx={{
								background: types[dep.typeName].color,
								color: '#fff',
								fontSize: '0.75em',
								minWidth: '8.5em',
								px: 0.8,
							}}
						/>
					</Grid>

					{/* 行先 */}
					<Grid
						sx={{
							textAlign: 'center',
							flex: '1 1 auto',
							minWidth: 0,
						}}
					>
						<Box
							sx={{
								overflow: 'hidden',
								whiteSpace: 'nowrap',
							}}
						>
							<OverflowMarquee>{label(dep.terminal)}</OverflowMarquee>
						</Box>
					</Grid>

					{/* 時刻 */}
					<Grid
						sx={{
							flex: `0 0 ${timeWidth}px`,
							textAlign: 'right',
						}}
					>
						<Typography variant='body2' fontWeight='bold'>
							{toTimeString(dep.time)}
						</Typography>
					</Grid>
				</Grid>
			</Box>

			<TrainStopsDialog dep={dep} isShowDialog={isShowDialog} onClose={() => setIsShowDialog(false)} emphasized={[`${station},${dep.time}`]} />
		</>
	);
}

export default DepartureRow;
