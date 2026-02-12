import React from 'react';

import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Tabs,
    Typography
} from '@mui/material';
import '@offlegacy/nuqs-hash-router';
import { useQueryState } from 'nuqs';

import StationSelecter, { StationSelectButtons } from '../components/StationSelecter.jsx';
import TrainStopsDialog from '../components/TrainStopsDialog.jsx';

import stations from '../data/stations.json';
import types from '../data/types.json';

import { searchDeparture } from '../utils/readOud.js';

function TimeTable() {

    const [station, setStation] = useQueryState('station')
    const [direction, setDirection] = useQueryState('direction', { defaultValue: 0 })

    const [departures, setDepartures] = React.useState(Array.from({ length: 24 }, () => []));
    const [loading, setLoading] = React.useState(false);

    const [pushed, setPushed] = React.useState(null);
    const [isShowDialog, setIsShowDialog] = React.useState(false);

    function divideDeps(deps) {
        let result = Array.from({ length: 27 }, () => []);
        for (const dep of deps) {
            const hour = Math.floor(dep.time / 3600) % 24;
            const min = Math.floor((dep.time % 3600) / 60);
            result[hour < 3 ? hour + 24 : hour].push({ ...dep, min });
        }
        result.forEach(deps => deps.sort((a, b) => a.time - b.time));
        return result;
    }

    React.useEffect(() => {
        if (!station) return;
        setDirection(0);
        setLoading(true);
        searchDeparture({ name: station, role: 'station' }, stations[station]?.directions[0]).then(deps => {
            setDepartures(divideDeps(deps))
            setLoading(false);
        })
    }, [station]);

    React.useEffect(() => {
        if (station && stations[station]?.directions[direction]) {
            setLoading(true);
            searchDeparture({ name: station, role: 'station' }, stations[station]?.directions[direction])
                .then(deps => setDepartures(divideDeps(deps)))
                .catch(() => {
                    setDepartures(Array.from({ length: 27 }, () => []));
                    alert('エラーが発生しました\nもう一度お試しください');
                })
                .finally(() => setLoading(false));
        }
    }, [direction]);

    return (
        <>
            <Typography variant="h6">時刻表</Typography>
            <Stack sx={{ mt: 2 }} spacing={2}>
                <StationSelecter
                    value={station ? {
                        value: station,
                        label: station,
                        role: 'station',
                        kana: stations[station]?.kana
                    } : null}
                    placeholder={'駅を選択'}
                    onChange={(value => setStation(value.value))}
                    busStop={false}
                />
                <StationSelectButtons
                    onSelect={station => setStation(station)}
                />
                <Stack sx={{ width: '100%', px: 'auto' }}>
                    <Tabs 
                        value={direction} 
                        onChange={(_, v) => setDirection(v)}
                        variant="scrollable"
                        scrollButtons='auto'
                        allowScrollButtonsMobile
                        sx={{
                            '& .MuiTabs-flexContainer': {
                                justifyContent: 'center',
                            },
                            '& .MuiTabs-scroller': {
                                overflowX: 'auto',
                            },
                        }}
                    >
                        {stations[station]?.directions?.map((direction, i) => <Tab label={`${direction.stationName} 方面`} key={i} />)}
                    </Tabs>
                </Stack>
            </Stack>

            <TableContainer sx={{ mt: 2 }} component={Paper}>
                <Table>
                    <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '95%' }} />
                    </colgroup>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} sx={{ textAlign: 'center' }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : (
                            departures.map((deps, i) => (
                                <TableRow key={i} sx={{ width: '100%', p: 0, overflowX: 'auto', backgroundColor: i % 2 === 0 ? 'white' : '#f0f0f0', display: i < 3 ? 'none' : '' }}>
                                    <TableCell sx={{ textAlign: 'right', backgroundColor: i % 2 === 0 ? '#f0f0f0ff' : '#e0e0e0ff', borderRight: '1px solid #ccc', position: 'sticky', zIndex: 2, left: 0 }}><Typography variant="h5">{i}</Typography></TableCell>
                                    <TableCell sx={{ p: 0 }}>
                                        <Stack direction="row" gap={2}>
                                            {deps.map((dep, j) => {
                                                const strong = dep.typeName === '特急' || dep.typeName === 'ライナー';
                                                return (
                                                    <Button onClick={() => { setPushed(dep); setIsShowDialog(true); }} key={`${i}-${j}`}>
                                                        <Box sx={{ flex: '0 0 42px', textAlign: 'center' }}>
                                                            <Box sx={{ background: strong ? types[dep.typeName]?.color : '' }}>
                                                                <Typography color={strong ? 'white' : types[dep.typeName]?.color} variant='h6'>
                                                                    {String(dep.min).padStart(2, '0')}
                                                                </Typography>
                                                            </Box>
                                                            <Typography color={types[dep.typeName]?.color} sx={{ whiteSpace: 'nowrap' }} variant="body6">
                                                                {dep.terminal}
                                                            </Typography>
                                                        </Box>
                                                    </Button>
                                                )
                                            })}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {pushed && isShowDialog && <TrainStopsDialog dep={pushed} line={stations[station]?.directions[direction]?.route} isShowDialog={isShowDialog} onClose={() => { setIsShowDialog(false); setPushed(null); }} emphasized={[station]} />}
        </>
    )
}

export default TimeTable