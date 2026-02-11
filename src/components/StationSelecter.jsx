import React from 'react';

import {
    Button,
    Menu,
    MenuItem,
    Stack
} from '@mui/material';
import { useAtomValue } from 'jotai';
import Select from 'react-select';

import { myStationsAtom, nearestStationAtom } from '../utils/Atom.js';

import busStops from '../data/busStops.json';
import stations from '../data/stations.json';

export default function StationSelecter({ref, value, placeholder, onChange, autoFocus = false, disabledStations = [], station = true, busStop = true}) {

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
            autoFocus={autoFocus}
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

export function StationSelectButtons({ onSelect, disabledStations = [] }) {
    const myStations = useAtomValue(myStationsAtom);
    const nearestStation = useAtomValue(nearestStationAtom);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    function handleClick(event) {
        setAnchorEl(event.currentTarget);
    };
    function handleClose(name) {
        setAnchorEl(null);
        if (typeof name === 'string') onSelect(name);
    };

    return (
        <Stack spacing={1} direction="row" gap={1}>
            <Button onClick={() => onSelect(nearestStation)} disabled={!nearestStation || disabledStations.includes(nearestStation)} size="small" variant="outlined" fullWidth>
                最寄り駅
            </Button>
            <Button onClick={handleClick} size="small" variant="outlined" fullWidth>
                マイ駅から選ぶ
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {myStations.filter((value) => value.role == 'station' && !disabledStations.includes(value.name)).map(({name}) => (
                    <MenuItem key={name} onClick={() => handleClose(name)}>{name}</MenuItem>
                ))}
            </Menu>
        </Stack>
    )
}