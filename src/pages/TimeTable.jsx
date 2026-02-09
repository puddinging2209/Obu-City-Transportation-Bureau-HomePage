import { Stack, Typography } from '@mui/material';
import '@offlegacy/nuqs-hash-router';
import { useQueryState } from 'nuqs';
import StationSelecter from '../components/StationSelecter.jsx';

import stations from '../data/stations.json';

function TimeTable() {

    const [station, setStation] = useQueryState('station')

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
            </Stack>
        </>
    )
}

export default TimeTable