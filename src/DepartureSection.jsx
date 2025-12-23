import React from 'react';

function DepartureSection() {
  return (
    <section className="departure-area">
      <h2>発車案内（マイ駅・停留所）</h2>
      <div className="departure-list">
        <div className="departure-card">
          <div className="card-header">
            <h3>大府</h3><a>⇆ 方面切替</a>
          </div>
          <table>
            <tbody>
              <tr>
                <td><a className="type" href="#">特急</a></td>
                <td>沓掛</td>
                <td className="time">10:12</td>
              </tr>
              <tr>
                <td><a className="type" href="#">新快速</a></td>
                <td>刈谷</td>
                <td className="time">10:20</td>
              </tr>
            </tbody>
          </table>
          <a href="#" className="more-link">もっと見る</a>
        </div>

        <div className="departure-card">
          <div className="card-header">
            <h3>大府駅前</h3><a>⇆ 方面切替</a>
          </div>
          <table>
            <tbody>
              <tr>
                <td><a className="type" href="#">南コース</a></td>
                <td>右回り</td>
                <td className="time">10:08</td>
              </tr>
              <tr>
                <td><a className="type" href="#">南コース</a></td>
                <td>右回り</td>
                <td className="time">10:25</td>
              </tr>
            </tbody>
          </table>
          <a href="#" className="more-link">もっと見る</a>
        </div>

        <div className="departure-card">
          <div className="card-header">
            <h3>共和三丁目</h3><a>⇆ 方面切替</a>
          </div>
          <table>
            <tbody>
              <tr>
                <td><a className="type" href="#">普通</a></td>
                <td>緒川</td>
                <td className="time">10:15</td>
              </tr>
              <tr>
                <td><a className="type" href="#">普通</a></td>
                <td>鞍流瀬川</td>
                <td className="time">10:30</td>
              </tr>
            </tbody>
          </table>
          <a href="#" className="more-link">もっと見る</a>
        </div>

        <div className="add-card">
          <img className="icon-plus" src="/image/icon_add.png" alt="プラスアイコン" />
          <p>マイ駅・停留所を追加</p>
        </div>
      </div>
    </section>
  );
};

export default DepartureSection;