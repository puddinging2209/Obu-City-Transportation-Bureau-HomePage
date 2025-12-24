import React from 'react';
import Select from 'react-select';

import { toTimeString } from './func.js';
import { searchDeparture } from './readOud.js';
import stations from '/public/stations.json';

function DepartureSection() {
    const [myStations, setMyStations] = React.useState(localStorage.getItem('myStations') ? JSON.parse(localStorage.getItem('myStations')) : ['大府']);
    const [myDirections, setMyDirections] = React.useState(Array.from({length: myStations.length}, () => null))
    const myDepartures = myStations.map((sta, i) => {
        return searchDeparture(sta, myDirections[i])
    })

  return (
    <section className="departure-area">
      <h2>発車案内（マイ駅・停留所）</h2>
          <div className="departure-list">
            {myStations.map((station, i) => (
              <div className="departure-card" key={station}>
                <div className="card-header">
                        <h3>{station}</h3>
                        <Select
                            onChange={(e) => {
                                setMyDirections(Array.from({
                                    ...myDirections,
                                    i: e.target.value
                                }))
                            }}
                            isSearchable={false}
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                            options={stations[station].directions.map((direction) => ({ value: direction, label: `${direction.stationName}方面` }))}
                        />
                </div>
                <table>
                  <tbody>
                    <tr>
                      <td><a className="type" href="#">{myDepartures[i][0].typeName}</a></td>
                      <td>{myDepartures[i][0].terminal}</td>
                      <td className="time">{toTimeString(myDepartures[i][0].time)}</td>
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