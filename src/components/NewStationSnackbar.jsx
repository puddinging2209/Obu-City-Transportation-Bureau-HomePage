import CloseIcon from '@mui/icons-material/Close';
import { Alert, IconButton, Snackbar } from '@mui/material';

export default function NewStationSnackbar({ open, onClose }) {
	const handleClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}
		onClose();
	};

	const action = (
		<IconButton size='small' aria-label='close' color='inherit' onClick={handleClose}>
			<CloseIcon fontSize='small' />
		</IconButton>
	);

	return (
		<>
			<Snackbar
				sx={{ anchorOrigin: { vertical: { xs: 'top', md: 'bottom' }, horizontal: 'center' } }}
				open={open}
				onClose={handleClose}
				action={action}
				autoHideDuration={5000}
			>
				<Alert onClose={handleClose} severity='success' variant='filled' sx={{ width: '100%' }}>
					新駅にアクセスしました
				</Alert>
			</Snackbar>
		</>
	);
}
