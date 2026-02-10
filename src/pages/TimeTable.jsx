import {
    Paper,
    Stack,
    Tab,
    Table,
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

import stations from '../data/stations.json';

function TimeTable() {

    const [station, setStation] = useQueryState('station')
    const [direction, setDirection] = useQueryState('direction', { defaultValue: 0 })

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
                    <TableHead>
                        <TableRow>
                            <TableCell>時</TableCell>
                            <TableCell>分</TableCell>
                        </TableRow>
                    </TableHead>
                </Table>
            </TableContainer>
        </>
    )
}

export default TimeTable