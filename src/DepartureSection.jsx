import React from 'react';
import Select from 'react-select';

import { nowsecond, toTimeString, name } from './func.js';
import { searchDeparture } from './readOud.js';
import stations from '/public/stations.json';
import types from '/public/types.json';

function DepartureSection() {
    const [myStations, setMyStations] = React.useState(localStorage.getItem('myStations') ? JSON.parse(localStorage.getItem('myStations')) : ['大府']);
    const initialDirections = myStations.map(station => stations[station]?.directions?.[0] || null);
    const [myDirections, setMyDirections] = React.useState(initialDirections)
    const [myDepartures, setMyDepartures] = React.useState([]);

    React.useEffect(() => {
        const fetchDepartures = async () => {
            const departures = await Promise.all(myStations.map(async (sta, i) => {
                if (myDirections[i]) {
                    return await searchDeparture(sta, myDirections[i]);
                }
                return [];
            }));
            setMyDepartures(departures);
        };
        fetchDepartures();
    }, [myStations, myDirections]);

  return (
    <section className="departure-area">
      <h2>発車案内（マイ駅・停留所）</h2>
          <div className="departure-list">
              {myStations.map((station, i) => {
                  function handleDirectionChange(selectedOption) {
                      const newDirections = [...myDirections];
                      newDirections[i] = selectedOption.value;
                      setMyDirections(newDirections);
                  }
                  const options = stations[station].directions.map((direction) => ({ value: direction, label: `${direction.stationName}方面` }))
                  return (
                      <div className="departure-card" key={station}>
                          <div className="card-header">
                              <h3>{station}</h3>
                              <Select
                                  value={options.find(opt => opt.value === myDirections[i]) || null}
                                  onChange={(e) => handleDirectionChange(e)}
                                  isSearchable={false}
                                  menuPortalTarget={document.body}
                                  styles={{
                                      menuPortal: base => ({ ...base, zIndex: 9999 })
                                  }}
                                  options={options}
                              />
                          </div>
                          <table>
                              <tbody>
                                  {[0, 1].map((j) => {
                                      const showDepartures = myDepartures.map((deps) => [deps.filter((d => d.time >= nowsecond()))[0] || null, deps.filter(d => d.time >= nowsecond())[1] || null]);
                                      const departure = showDepartures?.[i]?.[j];
                                      return departure ? (
                                          <tr key={j}>
                                              <td><a className="type" style={{background: types[departure.typeName].color}}>{departure.typeName}</a></td>
                                              <td>{name(departure.terminal)}</td>
                                              <td className="time">{toTimeString(departure.time)}</td>
                                          </tr>
                                      ) : (
                                          <tr key={j}>
                                              <td colSpan="3">データなし</td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                          <a href="#" className="more-link">もっと見る</a>
                      </div>
                  )
              })}
        <div className="add-card">
          <img className="icon-plus" src="/image/icon_add.png" alt="プラスアイコン" />
          <p>マイ駅・停留所を追加</p>
        </div>
      </div>
    </section>
  );
};

export default DepartureSection;