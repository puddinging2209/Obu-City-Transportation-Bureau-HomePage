import React from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography
} from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

import { addMyStationAtom, myStationsAtom } from '../utils/Atom.js';

import DepartureRow from './DepartureRow.jsx';
import DirectionBottomSheet from './DirectionBottomSheet.jsx';
import OverflowMarquee from './OverflowMarquee.jsx';

import busStops from '../data/busStops.json';
import lines from '../data/lines.json';
import stations from '../data/stations.json';

import { searchDeparture } from '../utils/readOud.js';
import { name } from '../utils/Station.js';
import { nowsecond } from '../utils/Time.js';

const StationContext = React.createContext(null);
const LineContext = React.createContext(null);

function DepartureCard({ station, addButton = false, removeButton = false }) {
    const navigate = useNavigate();

    const [myStations, setMyStations] = useAtom(myStationsAtom);

    const [direction, setDirection] = React.useState(stations[station?.name]?.directions?.[0] || busStops[station?.name]?.directions?.[0] || null);
    const [departures, setDepartures] = React.useState([]);

    React.useEffect(() => {
        setDirection(stations[station?.name]?.directions?.[0] || busStops[station?.name]?.directions?.[0] || null);
    }, [station]);

    React.useEffect(() => {
        if (direction) {
            searchDeparture(station, direction).then(deps => setDepartures(deps))
        }
    
    }, [direction]);

    const addMyStation = useSetAtom(addMyStationAtom);

    function removeStation() {
        const s = myStations.filter((value) => value.name != station.name);
        setMyStations(s);
        localStorage.setItem('myStations', JSON.stringify(s));
    }

    const directionOptions =
        (station.role === 'station') ? 
            stations[station.name]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route })) : 
            busStops[station.name]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route }))

    const [isOpenShowMore, setIsOpenShowMore] = React.useState(false);
        
    function scrollToDep() {
        const next = departures.find(dep => dep.time > nowsecond());
        if (!next) return;
        const el = document.getElementById(String(next.time));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    const [isOpenMobileSelector, setIsOpenMobileSelector] = React.useState({ open: false, options: [] });

    return (
        <>
        <LineContext value={direction?.route}>
        <StationContext value={station.name}>
            <Card key={station.name} sx={{ width: { xs: '100%', md: 300 }, minHeight: 240, position: 'relative', flexShrink: 0 }}>
                <CardContent>
                    <Box sx={{ mb: 1 }}>
                        <Typography variant="h6" sx={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap' }} noWrap>
                            <OverflowMarquee text={name(station.name)} />
                        </Typography>

                        <Typography variant="body2" color="text.secondary" noWrap>
                            {lines[direction?.route]?.show ?? direction?.route}
                        </Typography>
                    </Box>

                
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Select
                            options={directionOptions}
                            value={directionOptions.find(o => o.value == direction)}
                            onChange={e => {
                                setDirection(e.value);
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
                                    options: directionOptions
                                });
                            }}
                        >
                            {direction?.stationName}方面 ▼
                        </Button>
                    </Box>

                    <Stack spacing={1}>
                        {(departures?.filter(d => d.time >= nowsecond()).length !== 0) ? (
                            <Box>
                                    {departures?.filter(d => d.time >= nowsecond()).slice(0, 2)?.map(dep => (
                                        <DepartureRow key={dep.time} dep={dep} />
                                    ))}
                            </Box>
                        ) : (
                            <Typography variant='h6' sx={{ textAlign: 'center' }}>本日の運転は終了しました</Typography>
                        )}
                    </Stack>

                    <Button size="small" sx={{ mt: 1 }} onClick={() => {
                        setIsOpenShowMore(true);
                        navigate(`?modal=more-${station.name}`);
                    }}>
                        もっと見る
                    </Button>
                    <IconButton
                        size="small"
                        sx={{ position: 'absolute', bottom: 8, right: 8, display: removeButton ? 'block' : 'none' }}
                        onClick={() => removeStation()}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton><br />
                    <Button
                        sx={{ mt: 1, display: addButton ? 'block' : 'none' }}
                        variant='contained'
                        size="small"
                        onClick={() => addMyStation({name: station.name, role: 'station'})}
                        disabled={myStations.some(s => s.name === station.name)}
                        disableElevation
                    >マイ駅に追加</Button>
                </CardContent>
            </Card>
            
            <DirectionBottomSheet
                open={isOpenMobileSelector.open}
                options={isOpenMobileSelector.options}
                value={direction}
                onClose={() => {
                    setIsOpenMobileSelector({ open: false, options: [] });
                }}
                onSelect={value => {
                    setDirection(value);
                    setIsOpenMobileSelector({ open: false, options: [] });
                }}
            />

            <Dialog
                open={isOpenShowMore}
                onClose={() => {
                    navigate('/home');
                    setIsOpenShowMore(false);
                }}
                scroll="paper"  
                TransitionProps={{ onEntered: scrollToDep }}
                fullWidth
            >
                <DialogTitle>
                    {isOpenShowMore && (
                        <>
                            <Typography variant="h6" component="div">{station.name}</Typography>
                            <Typography variant="subtitle1" component="div">{`${direction?.stationName} 方面`}</Typography>
                        </>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Box>
                        {departures?.map(dep => (
                            <DepartureRow needId={true} key={dep.time} dep={dep} />
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        navigate('/home');
                        setIsOpenShowMore(false);
                    }}>閉じる</Button>
                </DialogActions>
            </Dialog>
        </StationContext>
        </LineContext>
        </>
    )
}

export { LineContext, StationContext };
export default DepartureCard