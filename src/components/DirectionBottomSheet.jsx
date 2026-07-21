import { Box, List, ListItemButton, ListItemText, Radio, SwipeableDrawer, Typography } from '@mui/material';
import lines from '../data/lines.json';
import { label } from '../utils/Station';

export default function DirectionBottomSheet({ open, onClose, options, value, onSelect }) {
	return (
		<SwipeableDrawer
			anchor='bottom'
			open={open}
			onClose={onClose}
			onOpen={() => {}}
			disableDiscovery
			disableScrollLock
			PaperProps={{
				sx: {
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16,
					pb: 2,
				},
			}}
		>
			<Box sx={{ px: 2, py: 1 }}>
				<Typography variant='subtitle1' fontWeight='bold'>
					方面を選択
				</Typography>
			</Box>

			<List>
				{options.map((o, i) => {
					const selected = i === value;

					return (
						<ListItemButton
							key={`${o.line}-${o.id}`}
							onClick={() => {
								onSelect(i);
							}}
						>
							<Radio checked={selected} />

							<ListItemText
								disableTypography
								primary={
									<>
										<Typography variant='subtitle1' sx={{ mt: 0, fontWeight: selected ? 'bold' : 'normal' }}>
											{label(o.id)} 方面
										</Typography>
										<Typography sx={{ mt: 0, fontWeight: selected ? 'bold' : 'normal' }} variant='body2'>
											{lines[o.line]?.show}
										</Typography>
									</>
								}
							/>
						</ListItemButton>
					);
				})}
			</List>
		</SwipeableDrawer>
	);
}
