import React from 'react';

import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

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


import { addMyStationAtom, myStationsAtom } from '../utils/Atom.js';
import searchNearestStation from '../utils/searchNearestStation.js';

import DepartureCard from './DepartureCard.jsx';
import StationSelecter from './StationSelecter.jsx';

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
                setNearestStation(name);

                const visited = localStorage.getItem('visitedStations') ? JSON.parse(localStorage.getItem('visitedStations')) : [];
                if (visited[0]?.name) {
                    localStorage.setItem('visitedStations', JSON.stringify([
                        ...visited,
                        { name, time: Date.now() }
                    ]));
                } else {
                    localStorage.setItem('visitedStations', JSON.stringify([
                        { name, time: Date.now() }
                    ]));
                }
            })
            .catch(() => {
                setLoadingNearest(false);
                alert('位置情報の取得に失敗しました');
            });
    }

    React.useEffect(updateNearest, []);

    const [isShowSearch, setIsShowSearch] = React.useState(false);

    const selectRef = React.useRef(null);

    function focusInput() {
        selectRef.current.focus();
    }

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
            <div width="100%"><DepartureCard key={`near-${nearestStation}`} station={{ name: nearestStation, role: 'station' }} addButton /></div>
            : 
            <Card sx={{ width: { xs: '100%', md: 300 }, minHeight: 240, position: 'relative', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ mt: 2 }}>位置情報が取得できませんでした</Typography>
            </Card>
        }
            
        </Container>


      <Typography variant="h6" sx={{ mb: 2 }}>マイ駅・停留所</Typography>

          <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', pb: 1, scrollSnapType: { xs: 'x mandatory', md: 'none'} }}>
            {myStations.map(sta => 
              <Box sx={{ scrollSnapAlign: { xs: 'center', md: 'none'} }} key={sta.name}>
                <Box sx={{ width: { xs: '85vw', md: 300 }}}><DepartureCard key={`my-${sta.name}`} station={sta} removeButton /></Box>
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
                TransitionProps={{ onEntered: focusInput }}
              fullWidth
          >
              <DialogTitle>
                  <Typography variant="h6" component="div">マイ駅・停留所を追加</Typography>
              </DialogTitle>
              <DialogContent>
                  <StationSelecter
                      ref={selectRef}
                      onChange={(selected) => {
                            if (selected) {
                                addMyStation({name: selected.value, role: selected.role});
                                setIsShowSearch(false);
                                navigate('/home');
                            }
                        }
                      }
                      includeMyStations={false}
                  />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        navigate('/home');
                        setIsShowSearch(false);
                    }}>閉じる</Button>
                </DialogActions>
          </Dialog>
    </Box>
  );
}
