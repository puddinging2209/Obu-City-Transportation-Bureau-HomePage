import { Box } from '@mui/material';
import TrainMap from '../features/trainMap/TrainMap';

function TrainMapPage() {
	return (
		<Box sx={{ width: '100%', height: 'calc(100dvh - calc(64px + 40px))' }}>
			<TrainMap></TrainMap>
		</Box>
	);
}

export default TrainMapPage
