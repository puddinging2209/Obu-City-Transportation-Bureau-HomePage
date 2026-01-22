import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer } from "@mui/material";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";

import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrainIcon from '@mui/icons-material/Train';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { isOpenDrawerAtom } from "../utils/Atom";


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
        { name: '大府市営地下鉄とは', icon: <HelpOutlineIcon />, path: '/about' },
    ];

    function handleNavigate(path) {
        navigate(path);
        setIsOpen(false);
    };

    function DrawerMenu() {
        return (
            <Box
                sx={{ width: 250 }}
                onClick={() => setIsOpen(false)}
                onKeyDown={() => setIsOpen(false)}
            >
            <List>
                {listItems.map(({name, icon, path}) => (
                <ListItem key={name} disablePadding>
                    <ListItemButton onClick={() => handleNavigate(path)}>
                    <ListItemIcon>
                        {icon}
                    </ListItemIcon>
                    <ListItemText primary={name} />
                    </ListItemButton>
                </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                {subListItems.map(({name, icon, path}) => (
                <ListItem key={name} disablePadding>
                    <ListItemButton onClick={() => handleNavigate(path)}>
                    <ListItemIcon>
                        {icon}
                    </ListItemIcon>
                    <ListItemText primary={name} />
                    </ListItemButton>
                </ListItem>
                ))}
            </List>
            </Box>
        )
    }

    return (
        <SwipeableDrawer
            anchor={'left'}
            open={isOpen}
            onClose={() => setIsOpen(false)}
            onOpen={() => setIsOpen(true)}
        >
            <DrawerMenu />
        </SwipeableDrawer>
    )
}

export default Drawer