import React from 'react';
import ReactModal from 'react-modal';
import Select from 'react-select';
import Marquee from 'react-fast-marquee';

import { nowsecond, toTimeString, name } from './func.js';
import { searchDeparture } from './readOud.js';
import stations from './stations.json';
import types from './types.json';

function DepartureSection() {
    const [myStations, setMyStations] = React.useState(localStorage.getItem('myStations') ? JSON.parse(localStorage.getItem('myStations')) : ['大府']);
    const initialDirections = myStations.map(station => stations[station]?.directions?.[0] || null);
    const [myDirections, setMyDirections] = React.useState(initialDirections)
    const [myDepartures, setMyDepartures] = React.useState([]);
    const [showSearch, setShowSearch] = React.useState(false);
    const [showMore, setShowMore] = React.useState(false)
    const textRefs = React.useRef([]);
    const [overflows, setOverflows] = React.useState([]);
    const moreTextRefs = React.useRef([]);
    const [moreOverflows, setMoreOverflows] = React.useState([]);

    function handleRemoveMyStation(index) {
        const newStations = myStations.filter((_, i) => i !== index);
        setMyStations(newStations);
        localStorage.setItem('myStations', JSON.stringify(newStations));
        const newDirections = myDirections.filter((_, i) => i !== index);
        setMyDirections(newDirections);
    };

    React.useEffect(() => {
        textRefs.current = myStations.map(() => [React.createRef(), React.createRef()]);
        setOverflows(myStations.map(() => [false, false]));
    }, [myStations]);

    React.useLayoutEffect(() => {
        const newOverflows = myStations.map(() => [false, false]);
        myDepartures.forEach((deps, i) => {
            if (deps) {
                deps.forEach((dep, j) => {
                    if (textRefs.current[i] && textRefs.current[i][j] && textRefs.current[i][j].current) {
                        const el = textRefs.current[i][j].current;
                        newOverflows[i][j] = el.scrollWidth > el.clientWidth;
                    }
                });
            }
        });
        setOverflows(newOverflows);
    }, [myDepartures]);

    React.useEffect(() => {
        if (showMore !== false) {
            moreTextRefs.current = myDepartures[showMore]?.map(() => React.createRef()) || [];
            setMoreOverflows(myDepartures[showMore]?.map(() => false) || []);
        }
    }, [showMore, myDepartures]);

    React.useLayoutEffect(() => {
        if (showMore !== false && myDepartures[showMore]) {
            const newOverflows = myDepartures[showMore].map(() => false);
            myDepartures[showMore].forEach((dep, idx) => {
                if (moreTextRefs.current[idx] && moreTextRefs.current[idx].current) {
                    const el = moreTextRefs.current[idx].current;
                    newOverflows[idx] = el.scrollWidth > el.clientWidth;
                }
            });
            setMoreOverflows(newOverflows);
        }
    }, [showMore, myDepartures]);

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
                                      return departure && (
                                          <tr key={j}>
                                              <td><a className="type" style={{background: types[departure.typeName].color}}>{departure.typeName}</a></td>
                                              <td ref={textRefs.current[i]?.[j]} style={overflows[i]?.[j] ? {overflow: 'visible', whiteSpace: 'nowrap'} : {overflow: 'hidden', whiteSpace: 'nowrap'}}>
                                                  {overflows[i]?.[j] ? (
                                                      <Marquee
                                                          speed={20}
                                                          delay={1}
                                                          pauseOnHover={true}
                                                          play={true}
                                                      ><div style={{marginRight: '30px'}}>{name(departure.terminal)}</div></Marquee>
                                                  ) : (
                                                      name(departure.terminal)
                                                  )}
                                              </td>
                                              <td className="time">{toTimeString(departure.time)}</td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                          <a className="more-link" onClick={() => setShowMore(i)}>もっと見る</a>
                          <button className="remove-btn" onClick={() => handleRemoveMyStation(i)}>×</button>
                      </div>
                  )
              })}
        <div className="add-card" onClick={() => setShowSearch(true)}>
          <img className="icon-plus" src="../public/image/icon_add.png" alt="プラスアイコン" />
          <p>マイ駅・停留所を追加</p>
        </div>
          </div>
          <ReactModal
            isOpen={showSearch}
            onRequestClose={() => setShowSearch(false)}
            className="Modal searchModal"
            overlayClassName="Overlay"
          >
              <div className="search-modal">
                <div className="search-content">
                    <h3>マイ駅・停留所を追加</h3>
                    <Select
                        options={Object.keys(stations).filter(station => !myStations.includes(station)).sort((a, b) => stations[a].kana.localeCompare(stations[b].kana)).map(station => ({ value: station, label: station }))}
                        onChange={(selected) => {
                            if (selected) {
                            const newStations = [...myStations, selected.value];
                            setMyStations(newStations);
                            localStorage.setItem('myStations', JSON.stringify(newStations));
                            const newDirections = [...myDirections, stations[selected.value]?.directions?.[0] || null];
                            setMyDirections(newDirections);
                            setShowSearch(false);
                            }
                        }}
                        placeholder="駅・停留所を検索"
                        isSearchable={true}
                        menuPortalTarget={document.body}
                        styles={{
                            menuPortal: base => ({ ...base, zIndex: 10001 })
                        }}
                    />
                    <a className='modalClose' onClick={() => setShowSearch(false)}>閉じる</a>
                </div>
              </div>
          </ReactModal>
          <ReactModal
            isOpen={showMore !== false}
            onRequestClose={() => setShowMore(false)}
            className="Modal listModal"
            overlayClassName="Overlay"
          >
              <div className="more-modal">
                  <div className="more-content">
                    <h3>{showMore !== false ? `${myStations[showMore]} ${myDirections[showMore]?.stationName}方面` : ''}</h3>
                          <table>
                              <tbody>
                                  {showMore !== false && myDepartures[showMore]?.map((train, i) => {
                                      const departure = train;
                                      console.log(myDepartures[showMore], departure);
                                      return departure ? (
                                          <tr key={`dep-${i}`}>
                                              <td><a className="type" style={{background: types[departure.typeName].color}}>{departure.typeName}</a></td>
                                              <td ref={moreTextRefs.current[i]} style={moreOverflows[i] ? {overflow: 'visible', whiteSpace: 'nowrap'} : {overflow: 'hidden', whiteSpace: 'nowrap'}}>
                                                  {moreOverflows[i] ? (
                                                      <Marquee
                                                          speed={20}
                                                          delay={1}
                                                          pauseOnHover={true}
                                                          play={true}
                                                      ><div style={{marginRight: '30px'}}>{name(departure.terminal)}</div></Marquee>
                                                  ) : (
                                                      name(departure.terminal)
                                                  )}
                                              </td>
                                              <td className="time">{toTimeString(departure.time)}</td>
                                          </tr>
                                      ) : (
                                          <tr key={`dep-${i}`}>
                                              <td colSpan="3">データなし</td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                    <a className='modalClose' onClick={() => setShowMore(false)}>閉じる</a>
                </div>
              </div>
          </ReactModal>
    </section>
  );
};

export default DepartureSection;