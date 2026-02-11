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
    TableHead,
    TableRow,
    Tabs,
    Typography
} from '@mui/material';
import '@offlegacy/nuqs-hash-router';
import { useQueryState } from 'nuqs';

import StationSelecter from '../components/StationSelecter.jsx';
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
        if (station && direction != null) {
            setLoading(true);
            searchDeparture({ name: station, role: 'station' }, stations[station]?.directions[direction]).then(deps => {
                setDepartures(divideDeps(deps))
                setLoading(false);
            })
        }
    }, [direction]);

    return (
        <>
            <Typography variant="h6">時刻表</Typography>
            <Stack sx={{ mt: 2 }}>
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

                    <TableHead>
                        <TableRow>
                            <TableCell>時</TableCell>
                            <TableCell>分</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} sx={{ textAlign: 'center' }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : (
                            departures.map((deps, i) => (
                                <TableRow key={i} sx={{ width: '100%', backgroundColor: i % 2 === 0 ? 'white' : '#f0f0f0', display: i < 3 ? 'none' : '' }}>
                                    <TableCell sx={{ textAlign: 'right', borderRight: '1px solid #ccc' }}><Typography variant="h5">{i}</Typography></TableCell>
                                    <TableCell>
                                        <Stack direction="row" gap={2}>
                                            {deps.map((dep, j) => (
                                                <Button onClick={() => { setPushed(dep); setIsShowDialog(true); }}>
                                                    <Box sx={{ flex: '0 0 42px', textAlign: 'center' }} key={`${i}-${j}`}>
                                                        <Typography color={types[dep.typeName]?.color} variant='h6'>
                                                            {dep.min}
                                                        </Typography>
                                                        <Typography color={types[dep.typeName]?.color} sx={{ whiteSpace: 'nowrap' }} variant="body6">
                                                            {dep.terminal}
                                                        </Typography>
                                                    </Box>
                                                </Button>
                                            ))}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <TrainStopsDialog dep={pushed} line={stations[station]?.directions[direction].route} isShowDialog={isShowDialog} setIsShowDialog={setIsShowDialog} emphasized={[station]} />
        </>
    )
}

export default TimeTable