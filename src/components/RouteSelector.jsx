import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

function RouteSelector({ routes, selected, onLineChange }) {
    return (
        <FormControl fullWidth sx={{ mt: 2, width: { xs: '100%', md: '70%' }, mx: 'auto' }}>
            <InputLabel>路線を選択</InputLabel>
            <Select
                value={selected}
                label="路線を選択"
                onChange={(e) => onLineChange(e.target.value)}
            >
                {routes.map((route) => (
                    <MenuItem key={route.id} value={route.id}>
                        {route.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default RouteSelector;