import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, SwipeableDrawer, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

import ArticleIcon from '@mui/icons-material/Article';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrainIcon from '@mui/icons-material/Train';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { isOpenDrawerAtom } from '../utils/Atom';

function Drawer() {
	const navigate = useNavigate();

	const [isOpen, setIsOpen] = useAtom(isOpenDrawerAtom);

	const listItems = [
		{ name: 'ホーム', icon: <HomeIcon />, path: '/home' },
		{ name: '路線図', icon: <MapIcon />, path: '/routemap' },
		{ name: '時刻表', icon: <ScheduleIcon />, path: '/timetable' },
		{ name: '乗換案内', icon: <SwapHorizIcon />, path: '/transfer' },
		{ name: '列車位置', icon: <TrainIcon />, path: '/position' },
	];

	const subListItems = [
		{ name: '駅ログ！', icon: <PlaceIcon />, path: '/log' },
		{ name: '地図', icon: <MapIcon />, path: '/map' },
		{ name: 'お知らせ一覧', icon: <ArticleIcon />, path: '/news' },
		{ name: '大府市営地下鉄とは', icon: <HelpOutlineIcon />, path: '/about' },
		{ name: '設定', icon: <SettingsIcon />, path: '/settings' },
	];

	// 環境変数からコミット情報を取得（ローカル環境では undefined になります）
	const commitHash = import.meta.env.VITE_COMMIT_HASH || 'local';

	function handleNavigate(path) {
		navigate(path);
		setIsOpen(false);
	}

	function DrawerMenu() {
		return (
			<Box sx={{ width: 250 }} onClick={() => setIsOpen(false)} onKeyDown={() => setIsOpen(false)}>
				<List>
					{listItems.map(({ name, icon, path }) => (
						<ListItem key={name} disablePadding>
							<ListItemButton onClick={() => handleNavigate(path)}>
								<ListItemIcon>{icon}</ListItemIcon>
								<ListItemText primary={name} />
							</ListItemButton>
						</ListItem>
					))}
				</List>
				<Divider />
				<List>
					{subListItems.map(({ name, icon, path }) => (
						<ListItem key={name} disablePadding>
							<ListItemButton onClick={() => handleNavigate(path)}>
								<ListItemIcon>{icon}</ListItemIcon>
								<ListItemText primary={name} />
							</ListItemButton>
						</ListItem>
					))}
				</List>
				<Stack sx={{ position: 'absolute', bottom: 0, pb: 2 }}>
					<Typography variant='body2' sx={{ mt: 2, ml: 2, color: 'text.secondary' }}>
						{`commit: ${commitHash.slice(0, 7)}`}
					</Typography>
				</Stack>
			</Box>
		);
	}

	return (
		<SwipeableDrawer anchor={'left'} open={isOpen} onClose={() => setIsOpen(false)} onOpen={() => setIsOpen(true)}>
			<DrawerMenu />
		</SwipeableDrawer>
	);
}

export default Drawer;
