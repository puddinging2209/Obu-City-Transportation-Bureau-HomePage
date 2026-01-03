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

import { nowsecond, toTimeString, name } from '../../func.js';
import { searchDeparture } from '../../readOud.js';
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
    if (m?.startsWith('more-')) setShowMore(Number(m.replace('more-', '')));
    else setShowMore(null);
  }, [location]);

  function removeStation(i) {
    const s = myStations.filter((_, idx) => idx !== i);
    const d = myDirections.filter((_, idx) => idx !== i);
    setMyStations(s);
    setMyDirections(d);
    localStorage.setItem('myStations', JSON.stringify(s));
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>発車案内（マイ駅・停留所）</Typography>

          <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', pb: 1, scrollSnapType: { xs: 'x mandatory', md: 'none'} }}>
        {myStations.map((sta, i) => {
          const options = (sta.role === 'station'
            ? stations[sta.name].directions
            : busStops[sta.name].directions
          ).map(d => ({ value: d, label: `${d.stationName}方面` }));

          const upcoming = myDepartures[i]
            ?.filter(d => d.time >= nowsecond())
            .slice(0, 2) ?? [];
            
          return (
            <Card key={sta.name} sx={{ width: { xs: '90%', md: 300 }, position: 'relative', flexShrink: 0, scrollSnapAlign: { xs: 'center', md: 'none' } }}>
              <CardContent>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap'}} noWrap>
                    <OverflowMarquee text={name(sta.name)} />
                  </Typography>

                  <Typography variant="body2" color="text.secondary" noWrap>
                    {lines[myDirections[i]?.route]?.show ?? myDirections[i]?.route}
                  </Typography>
                </Box>

                
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
                />

                <Stack spacing={1}>
                  {upcoming.map((dep, j) => (
                          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
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
                            </Table>
                  ))}
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
            <Card sx={{ width: 300, flexShrink: 0, scrollSnapAlign: { xs: 'center', md: 'none' } }} variant="outlined">
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
          
          
          <Dialog
            open={showSearch}
              onClose={() => {
                  setShowSearch(false);
                  navigate('/');
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
                          navigate('/');
                      }}>閉じる</a>
                </DialogContent>
          </Dialog>

      <Dialog
        open={showMore !== null}
              onClose={() => {
                  setShowMore(false);
                  navigate('/')
              }}
        fullWidth
      >
        <DialogTitle>
          {showMore !== null && `${myStations[showMore]?.name} ${myDirections[showMore]?.stationName} 方面 発車時刻一覧`}
        </DialogTitle>
        <DialogContent dividers>
                  <Table sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: "collapse" }}>
                    <TableBody>
                      {showMore !== null && myDepartures[showMore]?.map((dep, i) => (
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
                      navigate('/');
                      setShowMore(false);
                  }}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
