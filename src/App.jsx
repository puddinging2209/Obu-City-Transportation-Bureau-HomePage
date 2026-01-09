import React from 'react';

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { createTheme, CssBaseline, Dialog, DialogContent, DialogTitle, ThemeProvider } from '@mui/material';
// import './App.css';

import Header from './components/Header.jsx';
import MobileBottomNavigation from './components/MobileBottomNavigation.jsx';
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
                </Routes>
          </main>
              
          <MobileBottomNavigation />
          
          <Dialog
              open={isWarnOpen}
                  onClose={closeWarnModal}
                  fullWidth
              >
                  <DialogTitle>
                      <h1>このウェブサイトの内容は架空のもので実在しません</h1>
                      <h2>以下の事項に注意して閲覧してください</h2>
                  </DialogTitle>
                  <DialogContent>
              <ul>
                  <li>このウェブサイトは大府市公式のものではありません。</li>
                  <li>公式ホームページ→<a href="https://www.city.obu.aichi.jp/" className='link'>https://www.city.obu.aichi.jp/</a></li>
                  <li>架空の情報が含まれています。</li>
                  <li>大府市交通局という企業、団体は実在しません。</li>
                  <li>大府市営地下鉄は実在しません。掲載されている駅、列車、時刻は架空のもので実在しません。</li>
                  <li>大府市コミュニティバスふれあいバスは実在します。</li>
                  <li>ふれあいバスに関する内容はできるだけ正しいものになるよう努力しますが、間違っている場合があります。</li>
                  <li>このウェブサイトの内容に基づいて被ったいかなる損害についても、制作者は一切責任を負いません。</li>
              </ul>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{marginRight: '20px', alignSelf: 'center', cursor: 'pointer'}}>
                      <label>
                          <input type="checkbox" checked={!isShowWarn} onChange={(e) => setIsShowWarn(!e.target.checked)} />
                          今後この警告を表示しない
                      </label>
                  </div>
                <button onClick={window.close} className="modalClose" style={{marginRight: '20px'}}>ページを閉じる</button>
                <button onClick={closeWarnModal} className="modalClose" style={{marginRight: '20px'}}>×</button>
                      </div>
                  </DialogContent>
          </Dialog>

        </HashRouter>
          </ThemeProvider>
  );
}

export default App;