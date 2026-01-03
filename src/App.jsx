import React from 'react';

import { HashRouter, Routes, Route } from 'react-router-dom';

import { ThemeProvider, createTheme, CssBaseline, Dialog, DialogTitle, DialogContent } from '@mui/material';
import './App.css';

import Header from './components/Header.jsx'
import Home from './pages/home/Home.jsx'

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
          <div className="App">
            <Header />

      {/* メイン */}
          <main>
            <HashRouter>
                <Routes>
                    <Route path='/' element={<Home />}></Route>
                </Routes>
            </HashRouter>
          </main>

      {/* フッター（スマホ表示） */}
      <footer>
              <nav className="footer-nav">
                  <div>
                    <a href="#">地下鉄時刻表
                        <div>
                        <img className="icon" src="./image/subway-timeTable.png" alt="" />
                        </div>
                      </a>
                  </div>
                  <div>
          <a href="#">地下鉄路線図
            <div>
              <img className="icon" src="./image/subway-routeMap.png" alt="" />
            </div>
                      </a></div>
                  <div>
          <a href="#"><strong>乗換案内</strong>
            <div>
              <img className="icon" src="./image/transfer.png" alt="" />
            </div>
                      </a></div>
                  <div>
          <a href="#">バス時刻表
            <div>
              <img className="icon" src="./image/bus-timeTable.png" alt="" />
            </div>
                      </a></div>
                  <div>
          <a href="#">バス路線図
            <div>
              <img className="icon" src="./image/bus-routeMap.png" alt="" />
            </div>
                  </a>
                    </div>
        </nav>
          </footer>
          
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

          </div>
          </ThemeProvider>
  );
}

export default App;