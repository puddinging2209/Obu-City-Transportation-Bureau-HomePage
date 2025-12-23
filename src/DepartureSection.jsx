import React from 'react';

import { dia } from './readOud.js';

function DepartureSection() {
    const [myStations, setMyStations] = React.useState(localStorage.getItem('myStations') ? JSON.parse(localStorage.getItem('myStations')) : ['大府']);

  return (
    <section className="departure-area">
      <h2>発車案内（マイ駅・停留所）</h2>
          <div className="departure-list">
            {myStations.map((station) => (
              <div className="departure-card" key={station}>
                <div className="card-header">
                  <h3>{station}</h3><a>⇆ 方面切替</a>
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
        ))}
        <div className="add-card">
          <img className="icon-plus" src="/image/icon_add.png" alt="プラスアイコン" />
          <p>マイ駅・停留所を追加</p>
        </div>
      </div>
    </section>
  );
};

export default DepartureSection;