import React from 'react';

import { HashRouter, Navigate, Route, Link as RouterLink, Routes } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import { createTheme, CssBaseline, Dialog, DialogContent, DialogTitle, FormControlLabel, IconButton, ThemeProvider, Typography } from '@mui/material';

import Header from './components/Header.jsx';
import MobileBottomNavigation from './components/MobileBottomNavigation.jsx';
import About from './pages/About.jsx';
import Home from './pages/home/Home.jsx';

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

function App() {

    const [isWarnOpen, setIsWarnOpen] = React.useState(false);
    const [isShowWarn, setIsShowWarn] = React.useState(localStorage.getItem('isShowWarn') ? JSON.parse(localStorage.getItem('isShowWarn')) : true);
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
    <ThemeProvider theme={theme}>
        <CssBaseline />
            <HashRouter>
                <Header />

            <main>
                <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path='/home' element={<Home />}></Route>
                    <Route path='/about' element={<About />}></Route>  
                </Routes>
            </main>
                
            <MobileBottomNavigation />
            
            <Dialog
                open={isWarnOpen}
                onClose={closeWarnModal}
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h5">このウェブサイトの内容は架空のもので実在しません</Typography>
                    <Typography variant="body1">以下の事項に注意して閲覧してください</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant='body2'>このウェブサイトは大府市公式のものではありません。</Typography>
                    <Typography variant='body2'>大府市交通局、大府市営地下鉄はフィクションであり、実在の大府市とは一切関係ありません。</Typography>
                    <Typography variant='body2'>初めての方はこちらをご覧ください→<RouterLink to='/about'>大府市営地下鉄について</RouterLink></Typography>  
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <FormControlLabel
                            control={<input type="checkbox" checked={!isShowWarn} color='primary' onChange={(e) => setIsShowWarn(!e.target.checked)} />}
                            label="今後この警告を表示しない"
                            sx={{ ml: 0, mr: 'auto' }}
                        />
                        <IconButton onClick={closeWarnModal} sx={{ mr: 1 }}>
                              <CloseIcon fontSize='small' />
                        </IconButton>
                    </div>
                </DialogContent>
            </Dialog>

        </HashRouter>
    </ThemeProvider>
  );
}

export default App;