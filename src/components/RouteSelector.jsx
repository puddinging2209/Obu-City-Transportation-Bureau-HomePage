import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

function RouteSelector({ lines, selectedLine, onLineChange }) {
    return (
        <FormControl fullWidth sx={{ mt: 2, maxWidth: 660 }}>
            <InputLabel>路線を選択</InputLabel>
            <Select
                value={selectedLine}
                label="路線を選択"
                onChange={(e) => onLineChange(e.target.value)}
            >
                {Object.values(lines).filter(line => line.type === 'subway').map((line) => (
                    <MenuItem key={line.name} value={line.name}>
                        {line.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default RouteSelector;