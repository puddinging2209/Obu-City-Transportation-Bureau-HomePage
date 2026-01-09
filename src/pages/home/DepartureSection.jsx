import React from 'react';

import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

import AddIcon from '@mui/icons-material/Add';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography
} from '@mui/material';


import { addMyStationAtom, myStationsAtom } from '../../Atom.js';
import searchNearestStation from './searchNearestStation.js';

import busStops from '../../../public/data/busStops.json';
import stations from '../../../public/data/stations.json';
import DepartureCard from '../../components/DepartureCard.jsx';

export default function DepartureSection() {
    const navigate = useNavigate();

    const myStations = useAtomValue(myStationsAtom);
    const addMyStation = useSetAtom(addMyStationAtom);
    
    const [nearestStation, setNearestStation] = React.useState(null);
    const [loadingNearest, setLoadingNearest] = React.useState(false);

    function updateNearest() {
        setLoadingNearest(true);
        searchNearestStation()
            .then(name => {
                setLoadingNearest(false);
                setNearestStation(name)
            })
            .catch(() => {
                setLoadingNearest(false);
                alert('位置情報の取得に失敗しました');
            });
    }

    React.useEffect(updateNearest, []);

    const [isShowSearch, setIsShowSearch] = React.useState(false);

  return (
      <Box>
          
        <Container sx={{ mx: 'auto', pb: 2, width: { xs: '100%', md: 'fit-content' }, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', pb: 2, width: { xs: '100%', md: '100%' }, justifyContent: 'space-between', alignItems: 'center' }}>      
        <Typography variant="h6">最寄り駅</Typography>
        <Button sx={{ height: 36 }} loading={loadingNearest} onClick={() => {
            if (!loadingNearest) updateNearest();
        }}>更新</Button>
        </Box>
        {nearestStation ?
            <DepartureCard station={{name: nearestStation, role: 'station'}} addButton /> : 
            <Card sx={{ width: { xs: '100%', md: 300 }, minHeight: 240, position: 'relative', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ mt: 2 }}>位置情報が取得できませんでした</Typography>
            </Card>
        }
            
        </Container>


      <Typography variant="h6" sx={{ mb: 2 }}>マイ駅・停留所</Typography>

          <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', pb: 1, scrollSnapType: { xs: 'x mandatory', md: 'none'} }}>
            {myStations.map(sta => 
              <Box sx={{ scrollSnapAlign: { xs: 'center', md: 'none'} }}>
                <DepartureCard key={`my-${sta.name}`} station={sta} removeButton />
              </Box>
            )}
            <Card sx={{ width: { xs: '85%', md: 300 }, flexShrink: 0, scrollSnapAlign: { xs: 'center', md: 'none' } }} variant="outlined">
                  <CardActionArea onClick={
                      () => {
                          setIsShowSearch(true);
                          navigate('?modal=addStation');
                      }
                    }
                    style={{width: '100%', height: '100%'}}
                  >
                    <AddIcon fontSize='large'/>
                    <Typography align="center">マイ駅を追加</Typography>
                </CardActionArea>
            </Card>
          </Stack>
          
          
          <Dialog
            open={isShowSearch}
              onClose={() => {
                  setIsShowSearch(false);
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
                                addMyStation({name: selected.value, role: selected.role});
                                setIsShowSearch(false);
                                navigate('/home');
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        navigate('/home');
                        setIsOpenShowMore(false);
                    }}>閉じる</Button>
                </DialogActions>
          </Dialog>
    </Box>
  );
}
