import { AppBar, Button, ButtonGroup, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Header() {

    const navigate = useNavigate();
    
    return (
        <AppBar position="sticky" color="default" elevation={1}>
            <Toolbar>
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