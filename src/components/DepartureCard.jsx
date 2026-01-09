import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import Select from 'react-select';

import busStops from '../../public/data/busStops.json';
import lines from '../../public/data/lines.json';
import stations from '../../public/data/stations.json';
import { name, nowsecond } from '../func.js';

function DepartureCard({ station, isShowAddButton = false }) {

    const [direction, setDirection] = React.useState(stations[s.name]?.directions?.[0] || busStops[s.name]?.directions?.[0] || null);

    const [isOpenMobileSelector, setIsOpenMobileSelector] = React.useState(false);

    return (
        <>
            <Card key={station} sx={{ width: { xs: '90%', md: 300 }, minHeight: 240, position: 'relative', flexShrink: 0 }}>
                <CardContent>
                    <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap' }} noWrap>
                            <OverflowMarquee text={name(station)} />
                        </Typography>

                        <Typography variant="body2" color="text.secondary" noWrap>
                            {lines[direction?.route]?.show ?? direction?.route}
                        </Typography>
                    </Box>

                
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Select
                            options={stations[station]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route }))}
                            value={stations[station]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route })).find(o => o.value === direction)}
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
                                    index: 'nearest',
                                    options: stations[station]?.directions.map(d => ({ value: d, label: `${d.stationName}方面`, route: d.route }))
                                });
                                navigate('?modal=directionSelector-nearest');
                            }}
                        >
                            {direction?.stationName}方面 ▼
                        </Button>
                    </Box>
                

                    <Stack spacing={1}>
                        {(nearestDeparture?.filter(d => d.time >= nowsecond()).length !== 0) ? (
                            <Box>
                                {nearestDeparture?.filter(d => d.time >= nowsecond()).slice(0, 2)?.map(dep => (
                                    <DepartureRow key={dep.time} dep={dep} />
                                ))}
                            </Box>
                        ) : (
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
                    </Button><br />
                    <Button
                        display={isShowAddButton ? 'block' : 'none'}
                        variant='contained'
                        size="small"
                        onClick={() => addMyStation(station, 'station')}
                        disabled={myStations.some(s => s.name === station)}
                        disableElevation
                    >マイ駅に追加</Button>
                </CardContent>
            </Card>
            
            <DirectionBottomSheet
            open={isOpenMobileSelector.open}
            options={isOpenMobileSelector.options}
            value={direction}
            onClose={() => {
                setIsOpenMobileSelector({ open: false, index: null, options: [] });
                navigate('/home');
            }}
            onSelect={value => {
                setDirection(value);
                setIsOpenMobileSelector({ open: false, index: null, options: [] });
                navigate('/home');
            }}
            />
        </>
    )
}