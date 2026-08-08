import UpdateIcon from '@mui/icons-material/Update';
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateButton() {
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW();

	if (!needRefresh) return null;

	return (
		<Dialog open={true} onClose={() => setNeedRefresh(false)}>
			<DialogTitle>新しいアップデートがあります</DialogTitle>
			<DialogContent>
				<Button variant='contained' color='primary' startIcon={<UpdateIcon />} onClick={() => updateServiceWorker(true)} size='small'>
					更新
				</Button>
			</DialogContent>
		</Dialog>
	);
}
