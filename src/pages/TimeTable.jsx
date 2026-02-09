import '@offlegacy/nuqs-hash-router';
import { useQueryState } from 'nuqs';
import StationSelecter from '../components/StationSelecter.jsx';

function TimeTable() {

    const [station, setStation] = useQueryState('station')

    return (
        <StationSelecter
            value={station}
            placeholder={'駅を選択'}
            onChange={(value => setStation(value.value))}
            busStop={false}
        />
    )
}

export default TimeTable