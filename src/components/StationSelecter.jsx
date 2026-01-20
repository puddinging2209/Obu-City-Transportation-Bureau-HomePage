import { useAtomValue } from 'jotai';
import Select from 'react-select';

import busStops from '../data/busStops.json';
import stations from '../data/stations.json';

import { myStationsAtom } from '../utils/Atom.js';

export default function StationSelecter({ref, onChange, includeMyStations = true, station = true, busStop = true}) {
    const myStations = useAtomValue(myStationsAtom);

    let options = [];
    if (station) options.push(
        ...Object.keys(stations)
            .map(station => ({ value: station, label: station, role: 'station', kana: stations[station].kana }))
    );
    if (busStop) options.push(
        ...Object.keys(busStops)
            .map(stop => ({ value: stop, label: stop, role: 'busStop', kana: busStops[stop].kana }))
    );

    if (!includeMyStations) {
        options = options
            .filter(station => !(myStations)
                .map(station => station.name)
                .includes(station))
    }

    return (
        <Select
            ref={ref}
            options={options.sort((a, b) => a.kana.localeCompare(b.kana))}
            onChange={onChange}
            placeholder="駅・停留所を検索"
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