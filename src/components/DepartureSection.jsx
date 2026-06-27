import React from 'react';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
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
    Tab,
    Tabs,
    Typography,
} from '@mui/material';

import { addMyStationAtom, myStationsAtom, nearestStationAtom } from '../utils/Atom.js';
import searchNearestStation from '../utils/searchNearestStation.js';

import DepartureCard from './DepartureCard.jsx';
import StationSelecter from './StationSelecter.jsx';

import stations from '../data/stations.json';

export default function DepartureSection() {
    const navigate = useNavigate();

    const [content, setContent] = React.useState('nearest');
    const [serchedStation, setSearchedStation] = React.useState(null);

    const myStations = useAtomValue(myStationsAtom);
    const addMyStation = useSetAtom(addMyStationAtom);

    const [nearestStation, setNearestStation] = React.useState(null);

    const [nearestAtom, setNearestAtom] = useAtom(nearestStationAtom);
    const [loadingNearest, setLoadingNearest] = React.useState(false);

    function updateNearest() {
        setLoadingNearest(true);
        searchNearestStation()
            .then((id) => {
                setLoadingNearest(false);
                setNearestStation(id);
                setNearestAtom(id);

                const visited =
                    localStorage.getItem('visitedStations') ?
                        JSON.parse(localStorage.getItem('visitedStations'))
                    :   [];
                if (Date.now() - visited.toReversed().find((s) => s.id === id)?.time < 300000)
                    return; // 5分以内は更新しない
                if (visited[0]?.id) {
                    localStorage.setItem(
                        'visitedStations',
                        JSON.stringify([...visited, { id, time: Date.now() }]),
                    );
                } else {
                    localStorage.setItem(
                        'visitedStations',
                        JSON.stringify([{ id, time: Date.now() }]),
                    );
                }
            })
            .catch(() => {
                setLoadingNearest(false);
                alert('位置情報の取得に失敗しました');
            });
    }

    React.useEffect(() => {
        if (!nearestAtom) {
            updateNearest();
        } else {
            setNearestStation(nearestAtom);
        }
    }, []);

    const [isShowSearch, setIsShowSearch] = React.useState(false);

    return (
        <Box>
            <Container
                sx={{
                    mx: 'auto',
                    pb: 2,
                    width: { xs: '100%', md: 'fit-content' },
                    textAlign: 'center',
                }}
            >
                <Stack>
                    <Tabs
                        value={content}
                        onChange={(event, newValue) => setContent(newValue)}
                        centered
                    >
                        <Tab label='最寄り駅' value='nearest' />
                        <Tab label='駅を検索' value='search' />
                    </Tabs>
                    {content === 'nearest' && (
                        <Stack>
                            <Stack
                                sx={{
                                    display: 'flex',
                                    pb: 2,
                                    width: { xs: '100%', md: '100%' },
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                }}
                            >
                                <Button
                                    sx={{
                                        height: 36,
                                        ml: 'auto',
                                    }}
                                    loading={loadingNearest}
                                    onClick={() => {
                                        if (!loadingNearest) updateNearest();
                                    }}
                                >
                                    更新
                                </Button>
                            </Stack>
                            {nearestStation ?
                                <div width='100%'>
                                    <DepartureCard
                                        key={`near-${nearestStation}`}
                                        station={{ id: nearestStation, role: 'station' }}
                                        addButton
                                    />
                                </div>
                            :   <Card
                                    sx={{
                                        width: { xs: '100%', md: 300 },
                                        minHeight: 240,
                                        position: 'relative',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Typography variant='body2' sx={{ mt: 2 }}>
                                        位置情報が取得できませんでした
                                    </Typography>
                                </Card>
                            }
                        </Stack>
                    )}
                    {content === 'search' && (
                        <>
                            <Stack
                                sx={{
                                    display: 'flex',
                                    mt: 2,
                                }}
                            >
                                <StationSelecter
                                    onChange={(option) => {
                                        if (option) {
                                            setSearchedStation(option);
                                        }
                                    }}
                                    value={serchedStation ? serchedStation : null}
                                    autoFocus
                                />
                            </Stack>
                            {serchedStation && (
                                <Box sx={{ mt: 2, width: { xs: '100%', md: 300 } }}>
                                    <DepartureCard
                                        key={`search-${serchedStation.value}`}
                                        station={{
                                            id: serchedStation.value,
                                            role: serchedStation.role,
                                        }}
                                        addButton
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </Stack>
            </Container>

            <Typography variant='h6' sx={{ mb: 2, textAlign: 'left' }}>
                マイ駅・停留所
            </Typography>

            <Stack
                direction='row'
                spacing={2}
                sx={{
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap',
                    pb: 1,
                    scrollSnapType: { xs: 'x mandatory', md: 'none' },
                }}
            >
                {myStations.map((sta) => (
                    <Box sx={{ scrollSnapAlign: { xs: 'center', md: 'none' } }} key={sta.name}>
                        <Box sx={{ width: { xs: '85vw', md: 300 } }}>
                            <DepartureCard
                                key={`my-${sta.name}`}
                                station={{
                                    id: Object.values(stations).find((s) => s.name === sta.name)
                                        ?.id,
                                    ...sta,
                                }}
                                removeButton
                            />
                        </Box>
                    </Box>
                ))}
                <Card
                    sx={{
                        width: { xs: '85%', md: 300 },
                        flexShrink: 0,
                        scrollSnapAlign: { xs: 'center', md: 'none' },
                    }}
                    variant='outlined'
                >
                    <CardActionArea
                        onClick={() => {
                            setIsShowSearch(true);
                            navigate('?modal=addStation');
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <AddIcon fontSize='large' />
                        <Typography align='center'>マイ駅を追加</Typography>
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
                    <Typography variant='h6' component='div'>
                        マイ駅・停留所を追加
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <StationSelecter
                        onChange={(selected) => {
                            if (selected) {
                                addMyStation({ name: selected.value, role: selected.role });
                                setIsShowSearch(false);
                                navigate('/home');
                            }
                        }}
                        autoFocus
                        disabledStations={myStations.map((s) => s.name)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            navigate('/home');
                            setIsShowSearch(false);
                        }}
                    >
                        閉じる
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
