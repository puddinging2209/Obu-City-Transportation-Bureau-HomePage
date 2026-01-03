import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
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

                <Box sx={{ display: { xs: 'none', md: 'flex' }, textAlign: 'right', gap: 1 }}>
                    <Button onClick={() => navigate('/routemap')}>路線図</Button>
                    <Button onClick={() => navigate('/transfer')}>乗換案内</Button>
                    <Button onClick={() => navigate('/timetable')}>時刻表</Button>
                    <Button onClick={() => navigate('/position')}>列車位置</Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;