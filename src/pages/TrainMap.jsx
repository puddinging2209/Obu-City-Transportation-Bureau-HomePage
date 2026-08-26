import { Box } from '@mui/material';
import TrainMap from '../features/trainMap/TrainMap';

function TrainMapPage() {
	return (
		<Box sx={{ width: '100%', height: { xs: 'calc(100dvh - calc(64px + 56px))', md: 'calc(100dvh - 64px)' } }}>
			<TrainMap></TrainMap>
		</Box>
	);
}

export default TrainMapPage;
