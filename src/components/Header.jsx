import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

function Header() {
    
    return (
        <AppBar position="sticky" color="default" elevation={1}>
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    大府市交通局
                </Typography>

                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                    <Button>地下鉄時刻表</Button>
                    <Button>地下鉄路線図</Button>
                    <Button>乗換案内</Button>
                    <Button>バス時刻表</Button>
                    <Button>バス路線図</Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;