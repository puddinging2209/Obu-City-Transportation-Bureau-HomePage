import React, { Suspense } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    CircularProgress,
    createTheme,
    CssBaseline,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    ThemeProvider,
    Typography,
} from '@mui/material';
import { NuqsAdapter } from '@offlegacy/nuqs-hash-router';
import { Outlet, Link as RouterLink } from 'react-router-dom';

import Drawer from './Drawer.jsx';
import Header from './Header.jsx';
import MobileBottomNavigation from './MobileBottomNavigation.jsx';
import UpdateButton from './UpdateButton.jsx';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2', // 地下鉄っぽい青
        },
        secondary: {
            main: '#ff6600', // バス色
        },
    },
    shape: {
        borderRadius: 8,
    },
});

function Layout() {
    const [isWarnOpen, setIsWarnOpen] = React.useState(false);
    const [isShowWarn, setIsShowWarn] = React.useState(
        localStorage.getItem('isShowWarn') ? JSON.parse(localStorage.getItem('isShowWarn')) : true,
    );

    function closeWarnModal() {
        setIsWarnOpen(false);
        if (!isShowWarn) {
            localStorage.setItem('isShowWarn', false);
        }
    }

    React.useEffect(() => {
        if (isShowWarn) setIsWarnOpen(true);
    }, []);

    return (
        <NuqsAdapter>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Header />
                <Drawer />

                <main style={{ paddingBottom: '72px' }}>
                    <Suspense
                        fallback={
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: '400px',
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </main>

                <MobileBottomNavigation />

                <UpdateButton />

                <Dialog open={isWarnOpen} onClose={closeWarnModal} fullWidth>
                    <DialogTitle>
                        <Typography variant='h5' component='div'>
                            このウェブサイトの内容は架空のもので実在しません
                        </Typography>
                        <Typography variant='body1' component='div'>
                            以下の事項に注意して閲覧してください
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant='body2'>
                            初めての方はこちらをご覧ください→
                            <RouterLink to='/about' onClick={closeWarnModal}>
                                大府市営地下鉄について
                            </RouterLink>
                        </Typography>
                        <Typography variant='body2'>
                            このウェブサイトは大府市公式のものではありません。
                        </Typography>
                        <Typography variant='body2'>
                            大府市交通局、大府市営地下鉄はフィクションであり、実在の大府市とは一切関係ありません。
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <FormControlLabel
                                control={
                                    <input
                                        type='checkbox'
                                        checked={!isShowWarn}
                                        color='primary'
                                        onChange={(e) => setIsShowWarn(!e.target.checked)}
                                    />
                                }
                                label='今後この警告を表示しない'
                                sx={{ ml: 0, mr: 'auto' }}
                            />
                            <IconButton onClick={closeWarnModal} sx={{ mr: 1 }}>
                                <CloseIcon fontSize='small' />
                            </IconButton>
                        </Box>
                    </DialogContent>
                </Dialog>
            </ThemeProvider>
        </NuqsAdapter>
    );
}

export default Layout;
