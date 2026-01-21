import Select from 'react-select';

import busStops from '../data/busStops.json';
import stations from '../data/stations.json';


export default function StationSelecter({ref, value, placeholder, onChange, disabledStations = [], station = true, busStop = true}) {

    let options = [];
    if (station) options.push(
        ...Object.keys(stations)
            .map(station => ({ value: station, label: station, role: 'station', kana: stations[station].kana }))
    );
    if (busStop) options.push(
        ...Object.keys(busStops)
            .map(stop => ({ value: stop, label: stop, role: 'busStop', kana: busStops[stop].kana }))
    );

    if (disabledStations.length) {
        options = options
            .filter(station => !disabledStations.includes(station.value));
    }

    return (
        <Select
            ref={ref}
            options={options.sort((a, b) => a.kana.localeCompare(b.kana))}
            onChange={onChange}
            value={value}
            placeholder={placeholder ?? "駅・バス停を検索"}
            isSearchable={true}
            menuPortalTarget={document.body}
            styles={{
                menuPortal: base => ({ ...base, zIndex: 10001 })
            }}
            formatOptionLabel={({ _, label, role }) => (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>{label}</div>
                    <div style={{ fontSize: '12px', color: 'gray' }}>{role === 'station' ? '駅' : role === 'busStop' ? '停留所' : ''}</div>
                </div>
            )}
        />
    )
}