import React from 'react';
import DepartureSection from './DepartureSection';
import './App.css';
import ReactModal from 'react-modal';

function App() {

    const [isWarnOpen, setIsWarnOpen] = React.useState(true);
    function closeWarnModal() {
        setIsWarnOpen(false);
    }
    ReactModal.setAppElement('#root');

  return (
    <div className="App">
      {/* ヘッダー（PC表示） */}
      <header>
        <div className="header-top">
          <div className="title">
            <a href="index.html">大府市交通局</a>
          </div>
        </div>

        {/* 共通ナビゲーション */}
        <nav className="header-nav">
          <div>
            <a href="#"><img className="icon" src="/image/subway-timeTable.png" alt="" />地下鉄時刻表</a>
          </div>
          <div>
            <a href="#"><img className="icon" src="/image/subway-routeMap.png" alt="" />地下鉄路線図</a>
          </div>
          <div>
            <a href="#" className="transfer"><img className="icon" src="/image/transfer.png" alt="" />乗換案内</a>
          </div>
          <div>
            <a href="#"><img className="icon" src="/image/bus-timeTable.png" alt="" />バス時刻表</a>
          </div>
          <div>
            <a href="#"><img className="icon" src="/image/bus-routeMap.png" alt="" />バス路線図</a>
          </div>
        </nav>
      </header>

      {/* メイン */}
      <main>
        <DepartureSection />

        {/* 運行情報 */}
        <div className="service-info">
          <div className="info-box">
            <h2>地下鉄 運行情報</h2>
            <p className="status-normal">現在、平常通り運行しています。</p>
          </div>
          <div className="info-box">
            <h2>ふれあいバス 運行情報</h2>
            <p className="status-normal">現在、平常通り運行しています。</p>
          </div>
        </div>

        {/* 大きなボタン */}
        <div className="big-buttons">
          <a href="#" className="btn btn-subway">地下鉄に乗る</a>
          <a href="#" className="btn btn-bus">バスに乗る</a>
        </div>

        {/* 下部リンク */}
        <div className="link-list">
          <a href="#"><img className="icon" src="/image/transfer.png" alt="" />乗換案内</a>
          <a href="#"><img className="icon" src="/image/subway-timeTable.png" alt="" />地下鉄時刻表</a>
          <a href="#"><img className="icon" src="/image/subway-routeMap.png" alt="" />地下鉄路線図</a>
          <a href="#"><img className="icon" src="/image/bus-timeTable.png" alt="" />バス時刻表</a>
          <a href="#"><img className="icon" src="/image/bus-routeMap.png" alt="" />バス路線図</a>
        </div>
      </main>

      {/* フッター（スマホ表示） */}
      <footer>
        <nav className="footer-nav">
          <a href="#">地下鉄時刻表
            <div>
              <img className="icon" src="/image/subway-timeTable.png" alt="" />
            </div>
          </a>
          <span>|</span>
          <a href="#">地下鉄路線図
            <div>
              <img className="icon" src="/image/subway-routeMap.png" alt="" />
            </div>
          </a>
          <span>|</span>
          <a href="#"><strong>乗換案内</strong>
            <div>
              <img className="icon" src="/image/transfer.png" alt="" />
            </div>
          </a>
          <span>|</span>
          <a href="#">バス時刻表
            <div>
              <img className="icon" src="/image/bus-timeTable.png" alt="" />
            </div>
          </a>
          <span>|</span>
          <a href="#">バス路線図
            <div>
              <img className="icon" src="/image/bus-routeMap.png" alt="" />
            </div>
          </a>
        </nav>
          </footer>
          
          <ReactModal
              isOpen={isWarnOpen}
              onRequestClose={closeWarnModal}
              contentLabel="Warning Modal"
              className="Modal warnModal"
              overlayClassName="Overlay"
          >
              <h1>このウェブサイトの内容は架空のもので実在しません</h1>
              <h2>以下の事項に注意して閲覧してください</h2>
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
              <h3>上記の内容が理解できない場合はページを閉じてください</h3>
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button onClick={window.close} className="modalClose" style={{marginRight: '20px'}}>ページを閉じる</button>
                <button onClick={closeWarnModal} className="modalClose" style={{marginRight: '20px'}}>×</button>
              </div>
          </ReactModal>

    </div>
  );
}

export default App;