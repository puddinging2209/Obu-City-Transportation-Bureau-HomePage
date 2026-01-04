import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Button,
  Chip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Select from 'react-select';
import { useLocation, useNavigate } from 'react-router-dom';

import OverflowMarquee from '../../components/OverflowMarquee.jsx';
import DirectionBottomSheet from '../../components/DirectionBottomSheet.jsx';

import { nowsecond, toTimeString, name } from '../../func.js';
import { searchDeparture } from '../../readOud.js';
import searchNearestStation from './searchNearestStation.js';

import stations from '../../stations.json';
import busStops from '../../busStops.json';
import lines from '../../lines.json';
import types from '../../types.json';

export default function DepartureSection() {
  const navigate = useNavigate();
  const location = useLocation();

  const [myStations, setMyStations] = React.useState(
    localStorage.getItem('myStations')?.match(/\[\{.*\}.*\]/) ? JSON.parse(localStorage.getItem('myStations')) : [{ name: '大府', role: 'station' }]
  );

  const [myDirections, setMyDirections] = React.useState(() =>
    myStations.map(
      s => stations[s.name]?.directions?.[0] || busStops[s.name]?.directions?.[0] || null
    )
  );

  const [myDepartures, setMyDepartures] = React.useState([]);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showMore, setShowMore] = React.useState(null);

    React.useEffect(() => {
    Promise.all(
      myStations.map((sta, i) =>
        myDirections[i] ? searchDeparture(sta, myDirections[i]) : []
      )
    ).then(setMyDepartures);
  }, [myStations, myDirections]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const m = params.get('modal');
    if (m?.startsWith('more-') && m.match(/more-[0-9]+/)) setShowMore(Number(m.replace('more-', '')));
    else if (m?.startsWith('more-')) setShowMore(m.replace('more-', ''))
    else setShowMore(null);
  }, [location]);
    
    const [nearestStation, setNearestStation] = React.useState(null);
    const [nearestDirection, setNearestDirection] = React.useState(null);
    const [nearestDeparture, setNearestDeparture] = React.useState([]);

    React.useEffect(() => {
        searchNearestStation()
        .then(name => setNearestStation(name))
        .catch(() => alert('位置情報の取得に失敗しました'));
    }, []);

    React.useEffect(() => {
        if (nearestStation) {
            const d = stations[nearestStation]?.directions?.[0] ?? null;
            setNearestDirection(d);
            searchDeparture({ name: nearestStation, role: 'station' }, d).then(deps => { setNearestDeparture(deps); console.log(deps) });
        }
    }, [nearestStation]);

    React.useEffect(() => {
        if (nearestDirection) {
            searchDeparture({ name: nearestStation, role: 'station' }, nearestDirection).then(deps => { setNearestDeparture(deps); console.log(deps); });
        }
    }, [nearestDirection]);

  function removeStation(i) {
    const s = myStations.filter((_, idx) => idx !== i);
    const d = myDirections.filter((_, idx) => idx !== i);
    setMyStations(s);
    setMyDirections(d);
    localStorage.setItem('myStations', JSON.stringify(s));
    }
    
    const [isOpenMobileSelector, setIsOpenMobileSelector] = React.useState({ open: false, index: null, options: []})

  return (
      <Box>
          
        <Box sx={{ overflowX: 'auto', mx: 'auto', pb: 2, width: 'fit-content', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>      
        <Typography variant="h6" sx={{ mb: 2 }}>最寄り駅</Typography>
        <Button onClick={() => {
            searchNearestStation()
            .then(name => setNearestStation(name))
            .catch(() => alert('位置情報の取得に失敗しました'));

        }}>更新</Button>
        </Box>
        <Card key={nearestStation} sx={{ width: { xs: '85%', md: 300 }, height: 240, position: 'relative', flexShrink: 0 }}>
                  {nearestStation ?
                      <CardContent>
                          <Box sx={{ mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap' }} noWrap>
                                  <OverflowMarquee text={name(nearestStation)} />
                              </Typography>

                              <Typography variant="body2" color="text.secondary" noWrap>
                                  {lines[nearestDirection?.route]?.show ?? nearestDirection?.route}
                              </Typography>
                          </Box>

            
                          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                              <Select
                                  options={stations[nearestStation]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route }))}
                                  value={stations[nearestStation]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route })).find(o => o.value === nearestDirection)}
                                  onChange={e => {
                                      setNearestDirection(e.value);
                                  }}
                                  isSearchable={false}
                                  menuPortalTarget={document.body}
                                  styles={{ container: b => ({ ...b, marginBottom: 8 }) }}
                                  formatOptionLabel={({ value, label, route }, { context }) => (
                                      <div style={{ display: 'flex', height: '100%', justifyContent: 'space-between' }}>
                                          <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: 'inherit' }}>{label}</Typography>
                                          {context === 'menu' && (
                                              <Typography sx={{ fontSize: '12px', color: 'inherit' }}>{lines[route]?.show ?? route}</Typography>
                                          )}
                                      </div>
                                  )}
                              />
                          </Box>
                    
                          <Box sx={{ display: { xs: 'block', md: 'none' }, marginBottom: 1 }}>
                              <Button
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  onClick={() => {
                                      setIsOpenMobileSelector({
                                          open: true,
                                          index: 'nearest',
                                          options: stations[nearestStation]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route }))
                                      });
                                      navigate('?modal=directionSelector-nearest');
                                  }}
                              >
                                  {nearestDirection?.stationName}方面 ▼
                              </Button>
                          </Box>
            

                          <Stack spacing={1}>
                              {(nearestDeparture?.filter(d => d.time >= nowsecond()).length !== 0) ? nearestDeparture?.filter(d => d.time >= nowsecond()).slice(0, 2).map((dep) => (
                                  <Table sx={{ tableLayout: 'fixed', width: '100%' }} key={`${dep.type}${dep.terminal}${dep.time}`}>
                                      <colgroup>
                                          <col style={{ width: '85px' }} />
                                          <col />
                                          <col style={{ width: '42px' }} />
                                      </colgroup>
                        
                                      <TableBody>
                                          <TableRow sx={{
                                              '& .MuiTableCell-root': {
                                                  overflow: 'hidden',
                                                  minHeight: '15px',
                                                  width: '100%',
                                                  padding: '0'
                                              },
                                              '&:last-child td, &:last-child th': {
                                                  border: 0
                                              }
                                          }}>
                                              <TableCell sx={{ px: 0, width: '85px' }}>
                                                  <Chip
                                                      label={dep.typeName}
                                                      size="small"
                                                      sx={{ background: types[dep.typeName].color, color: '#fff', mr: 1, width: '80px' }}
                                                  />
                                              </TableCell>

                                              <TableCell sx={{ px: 0 }}>
                                                  <div
                                                      style={{
                                                          width: '100%',
                                                          overflow: 'hidden',
                                                          whiteSpace: 'nowrap',
                                                      }}
                                                  >
                                                      <OverflowMarquee text={name(dep.terminal)} />
                                                  </div>
                                              </TableCell>

                                              <TableCell sx={{ px: 0, maxWidth: '30px' }}>
                                                  <Typography variant="body2" fontWeight="bold" sx={{ textAlign: 'right' }}>
                                                      {toTimeString(dep.time)}
                                                  </Typography>
                                              </TableCell>
                                          </TableRow>
                                      </TableBody>
                                  </Table>
                              )) : (
                                  <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                
                                      <TableRow sx={{
                                          '& .MuiTableCell-root': {
                                              overflow: 'hidden',
                                              minHeight: '15px',
                                              width: '100%',
                                              padding: '0'
                                          },
                                          '&:last-child td, &:last-child th': {
                                              border: 0
                                          }
                                      }}>
                                          <TableCell sx={{ px: 0, width: '100%' }}>
                                              <Typography variant='h6' sx={{ textAlign: 'center' }}>本日の運転は終了しました</Typography>
                                          </TableCell>
                                      </TableRow>
                                  </Table>
                              )}
                          </Stack>

                          <Button size="small" sx={{ mt: 1 }} onClick={() => {
                              setShowMore('nearest');
                              navigate('?modal=more-nearest');
                          }}>
                              もっと見る
                          </Button>
                      </CardContent> : 
                      <CardContent sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <Typography variant="body1" sx={{ textAlign: 'center' }}>位置情報が取得できませんでした</Typography>
                      </CardContent>
                      }
              </Card>
              </Box>


      <Typography variant="h6" sx={{ mb: 2 }}>発車案内（マイ駅・停留所）</Typography>

          <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', pb: 1, scrollSnapType: { xs: 'x mandatory', md: 'none'} }}>
        {myStations.map((sta, i) => {
          const options = (sta.role === 'station'
            ? stations[sta.name].directions
            : busStops[sta.name].directions
          ).map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route }));

          const upcoming = myDepartures[i]
            ?.filter(d => d.time >= nowsecond())
            .slice(0, 2) ?? [];
            
          return (
            <Card key={sta.name} sx={{ width: { xs: '85%', md: 300 }, height: 240, position: 'relative', flexShrink: 0, scrollSnapAlign: { xs: 'center', md: 'none' } }}>
              <CardContent>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap'}} noWrap>
                    <OverflowMarquee text={name(sta.name)} />
                  </Typography>

                  <Typography variant="body2" color="text.secondary" noWrap>
                    {lines[myDirections[i]?.route]?.show ?? myDirections[i]?.route}
                  </Typography>
                </Box>

                
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Select
                  options={options}
                  value={options.find(o => o.value === myDirections[i])}
                  onChange={e => {
                    const d = [...myDirections];
                    d[i] = e.value;
                    setMyDirections(d);
                  }}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                  styles={{ container: b => ({ ...b, marginBottom: 8 }) }}
                  formatOptionLabel={({ value, label, route }, { context }) => (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: 'inherit' }}>{label}</Typography>
                          {context === 'menu' && (
                              <Typography sx={{ fontSize: '12px', color: 'inherit' }}>{lines[route]?.show ?? route}</Typography>
                          )}
                    </div>
                )}
                />
                </Box>
                      
                <Box sx={{ display: { xs: 'block', md: 'none' }, marginBottom: 1 }}>
                <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => {
                    setIsOpenMobileSelector({
                        open: true,
                        index: i,
                        options: options
                    });
                    navigate(`?modal=directionSelector-${i}`);
                }}
                >
                {myDirections[i]?.stationName}方面 ▼
                </Button>
                </Box>
                

                <Stack spacing={1}>
                  {(upcoming.length !== 0) ? upcoming.map((dep) => (
                    <Table sx={{ tableLayout: 'fixed', width: '100%' }} key={`${dep.type}${dep.terminal}${dep.time}`}>
                    <colgroup>
                        <col style={{ width: '85px' }} />
                        <col />
                        <col style={{ width: '42px' }} />
                          </colgroup>
                          
                    <TableBody>
                        <TableRow sx={{
                            '& .MuiTableCell-root': {
                                overflow: 'hidden',
                                minHeight: '15px',
                                width: '100%',
                                padding: '0'
                            },
                            '&:last-child td, &:last-child th': {
                                border: 0
                            }
                        }}>
                        <TableCell sx={{ px: 0, width: '85px' }}>
                            <Chip
                            label={dep.typeName}
                            size="small"
                            sx={{ background: types[dep.typeName].color, color: '#fff', mr: 1, width: '80px'}}
                                />
                            </TableCell>

                            <TableCell sx={{ px: 0 }}>
                            <div
                                style={{
                                width: '100%',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                }}
                            >
                                <OverflowMarquee text={name(dep.terminal)} />
                            </div>
                            </TableCell>

                            <TableCell sx={{ px: 0, maxWidth: '30px'}}>
                            <Typography variant="body2" fontWeight="bold" sx={{textAlign: 'right'}}>
                                {toTimeString(dep.time)}
                            </Typography>
                            </TableCell>
                              </TableRow>
                            </TableBody>
                    </Table>
                  )) : (
                    <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                    
                        <TableRow sx={{
                            '& .MuiTableCell-root': {
                                overflow: 'hidden',
                                minHeight: '15px',
                                width: '100%',
                                padding: '0'
                            },
                            '&:last-child td, &:last-child th': {
                                border: 0
                            }
                        }}>
                            <TableCell sx={{ px: 0, width: '100%' }}>
                                <Typography variant='h6' sx={{textAlign: 'center'}}>本日の運転は終了しました</Typography>              
                            </TableCell>
                        </TableRow>
                    </Table>
                  )}
                </Stack>

                      <Button size="small" sx={{ mt: 1 }} onClick={() => {
                          setShowMore(i);
                          navigate(`?modal=more-${i}`)
                      }}>
                  もっと見る
                </Button>

                <IconButton
                  size="small"
                  sx={{ position: 'absolute', bottom: 8, right: 8 }}
                  onClick={() => removeStation(i)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          );
        })}
            <Card sx={{ width: { xs: '85%', md: 300 }, flexShrink: 0, scrollSnapAlign: { xs: 'center', md: 'none' } }} variant="outlined">
                  <CardActionArea onClick={
                      () => {
                          setShowSearch(true);
                          navigate('?modal=addStation');
                      }
                    }
                    style={{width: '100%', height: '100%'}}
                  >
                      <img className="icon-plus" src={'./image/icon_add.png'} alt="plus" style={{height: '50px'}} />
                    <Typography align="center">マイ駅を追加</Typography>
                </CardActionArea>
            </Card>
          </Stack>


          <DirectionBottomSheet
            open={isOpenMobileSelector.open}
            options={isOpenMobileSelector.options}
            value={(isOpenMobileSelector.index !== 'nearest') ? myDirections[isOpenMobileSelector.index] : nearestDirection}
            onClose={() => {
                setIsOpenMobileSelector({ open: false, index: null, options: [] });
                navigate('/home');
            }}
            onSelect={value => {
                const params = new URLSearchParams(location.search);
                const m = params.get('modal');
                if (m?.startsWith('directionSelector') && m.match(/directionSelector-[0-9]+/)) {
                    const d = [...myDirections];
                    d[isOpenMobileSelector.index] = value;
                    setMyDirections(d);
                } else if (m?.startsWith('directionSelector') && m == 'directionSelector-nearest') {
                    setNearestDirection(value);
                }

                setIsOpenMobileSelector({ open: false, index: null, options: [] });
                navigate('/home');
            }}
          />
          
          
          <Dialog
            open={showSearch}
              onClose={() => {
                  setShowSearch(false);
                  navigate('/home');
              }}
              fullWidth
          >
              <DialogTitle>
                  <h3>マイ駅・停留所を追加</h3>
              </DialogTitle>
                <DialogContent>
                    <Select
                          options={
                              [
                                  ...Object.keys(stations).filter(station => !(myStations).map(station => station.name).includes(station)).map(station => ({ value: station, label: station, role: 'station', kana: stations[station].kana })),
                                  ...Object.keys(busStops).filter(stop => !myStations.map(station => station.name).includes(stop)).map(stop => ({ value: stop, label: stop, role: 'busStop', kana: busStops[stop].kana })),
                              ].sort((a, b) => a.kana.localeCompare(b.kana))
                          }
                        onChange={(selected) => {
                            if (selected) {
                                const newStations = [...myStations, {name: selected.value, role: selected.role}];
                                setMyStations(newStations);
                                localStorage.setItem('myStations', JSON.stringify(newStations));
                                const newDirections = [...myDirections, stations[selected.value]?.directions?.[0] || busStops[selected.value]?.directions?.[0] || null];
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
                        formatOptionLabel={({ value, label, role }) => (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>{label}</div>
                                <div style={{ fontSize: '12px', color: 'gray' }}>{role === 'station' ? '駅' : role === 'busStop' ? '停留所' : ''}</div>
                            </div>
                        )}
                    />
                      <a className='modalClose' onClick={() => {
                          setShowSearch(false);
                          navigate('/home');
                      }}>閉じる</a>
                </DialogContent>
          </Dialog>

      <Dialog
        open={showMore != null}
              onClose={() => {
                  navigate('/home');
                  setShowMore(null);
              }}
        fullWidth
      >
        <DialogTitle>
          {showMore != null && `${myStations[showMore]?.name ?? nearestStation} ${myDirections[showMore]?.stationName ?? nearestDirection.stationName} 方面 発車時刻一覧`}
        </DialogTitle>
        <DialogContent dividers>
            <Table sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: "collapse" }}>
            <TableBody>
                {showMore != null && (showMore !== 'nearest' ? myDepartures[showMore] : nearestDeparture)?.map((dep, i) => (
                <>
                <colgroup>
                    <col style={{ width: '85px' }} />
                    <col />
                    <col style={{ width: '42px' }} />
                </colgroup>
            
                <TableRow sx={{
                    '& .MuiTableCell-root': {
                        overflow: 'hidden',
                        minHeight: '15px',
                        width: '100%',
                        padding: '3px 0',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                    },
                    '&:last-child td, &:last-child th': {
                        border: 0
                    }
                }}>
                <TableCell sx={{ px: 0, width: '85px' }}>
                    <Chip
                        label={dep.typeName}
                        size="small"
                        sx={{ background: types[dep.typeName].color, color: '#fff', mr: 1, width: '80px'}}
                        />
                    </TableCell>

                    <TableCell sx={{ px: 0 }}>
                    <div
                        style={{
                        width: '100%',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        }}
                    >
                        <OverflowMarquee text={name(dep.terminal)} />
                    </div>
                    </TableCell>

                    <TableCell sx={{ px: 0, maxWidth: '30px'}}>
                        <Typography variant="body2" fontWeight="bold" sx={{textAlign: 'right'}}>
                            {toTimeString(dep.time)}
                        </Typography>
                    </TableCell>
                    </TableRow>
                </>
                      ))}
                    </TableBody>
            </Table>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => {
                navigate('/home');
                setShowMore(null);
            }}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
