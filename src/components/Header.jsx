import { AppBar, Button, ButtonGroup, IconButton, Toolbar, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

import MenuIcon from '@mui/icons-material/Menu';

import { isOpenDrawerAtom } from '../utils/Atom';

function Header() {

    const navigate = useNavigate();
    const setIsOpenDrawer = useSetAtom(isOpenDrawerAtom);
    
    return (
        <AppBar position="sticky" color="default" elevation={1}>
            <Toolbar>
                <IconButton edge="start" color="inherit" sx={{ mr: 2 }} onClick={() => {
                    setIsOpenDrawer(true)
                }}>
                    <MenuIcon />
                </IconButton>
                <Typography
                    variant="h6"
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => navigate('/home')}
                >
                    大府市交通局
                </Typography>

                <ButtonGroup variant='text' sx={{ display: { xs: 'none', md: 'block' }, ml: 'auto' }}>
                    <Button onClick={() => navigate('/routemap')}>路線図</Button>
                    <Button onClick={() => navigate('/transfer')}>乗換案内</Button>
                    <Button onClick={() => navigate('/timetable')}>時刻表</Button>
                    <Button onClick={() => navigate('/position')}>列車位置</Button>
                    <Button onClick={() => navigate('/about')}>大府市営地下鉄について</Button>
                </ButtonGroup>

                <Button sx={{ display: { xs:  'block', md: 'none' }, ml: 'auto' }} onClick={() => navigate('/about')}>大府市営地下鉄について</Button>
            </Toolbar>
        </AppBar>
    );
}

export default Header;