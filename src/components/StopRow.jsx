import { Box, Grid, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAtomValue } from 'jotai';

import OverflowMarquee from './OverflowMarquee.jsx';

import { settingsAtom } from '../utils/Atom.js';
import { toTimeString } from '../utils/Time.js';

import lines from '../data/lines.json';

function StopRow({ stop, emphasized = false, className = '' }) {
	const theme = useTheme();
	const showSeconds = useAtomValue(settingsAtom).general.showSeconds;
	const timeWidth = 42 * (!showSeconds ? 1 : 1.6);
	return (
		<div className={className}>
			<Box
				sx={{
					borderLeft: `4px solid ${lines[stop.lineName].color ?? '#000000'}`,

					borderBottom: `1px solid ${theme.palette.divider}`,
					py: '3px',
					background: emphasized ? alpha(theme.palette.warning[theme.palette.mode], 0.4) : '',
				}}
			>
				<Grid container wrap='nowrap' alignItems='center' columnGap={0.5} sx={{ pl: 1, justifyContent: 'space-between' }}>
					{/* 駅名 */}
					<Grid sx={{ flex: '0 0 auto' }}>
						<Box
							sx={{
								textAlign: 'left',
								flex: '1 1 auto',
								width: '100%',
							}}
						>
							<OverflowMarquee
								style={{
									fontWeight: emphasized ? 'bold' : 'normal',
								}}
							>
								{stop.name}
							</OverflowMarquee>
						</Box>
					</Grid>

					<Stack direction='row' sx={{ width: 'fit-content', alignItems: 'right' }}>
						{stop.stopType == 'stop' ?
							<Grid container spacing={2}>
								{/* 到着時刻 */}
								<Grid
									sx={{
										flex: `0 0 ${timeWidth}px`,
										textAlign: 'center',
									}}
								>
									<Typography variant='body2' fontWeight='bold'>
										{stop.arr != null ? toTimeString(stop.arr) : ''}
									</Typography>
								</Grid>

								{/* 発車時刻 */}
								<Grid
									sx={{
										flex: `0 0 ${timeWidth}px`,
										textAlign: 'center',
									}}
								>
									<Typography variant='body2' fontWeight='bold'>
										{stop.dep != null ? toTimeString(stop.dep) : ''}
									</Typography>
								</Grid>
							</Grid>
						:	<Box sx={{ width: timeWidth, textAlign: 'center' }}>
								<Typography variant='body2'>通過</Typography>
							</Box>
						}
					</Stack>
				</Grid>
			</Box>
		</div>
	);
}

export default StopRow;
