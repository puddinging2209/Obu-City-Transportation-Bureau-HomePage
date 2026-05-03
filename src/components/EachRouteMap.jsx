import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import RouteStationRow from './RouteStationRow';

function EachRouteMap({ line }) {
    if (!line) {
        return <Typography sx={{ mt: 2 }}>路線を選択してください。</Typography>;
    }

    const { name, stations } = line;
    const [types, setTypes] = React.useState([]);

    React.useEffect(() => {
        const typeSet = new Set();

        stations.forEach((station) => {
            if (!station.types) {
                return;
            }

            Object.entries(station.types).forEach(([type, value]) => {
                if (value !== null) {
                    typeSet.add(type);
                }
            });
        });

        setTypes(Array.from(typeSet));
    }, [stations]);

    return (
        <Stack alignItems="center" sx={{ mt: 2, px: 1 }}>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 660,
                    mx: 'auto',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Stack sx={{ position: 'relative', zIndex: 2 }}>
                    {stations.map((station, index) => (
                        <RouteStationRow
                            key={station.name || index}
                            station={station}
                            i={index}
                            stations={stations}
                            lines={types}
                            isEven={index % 2 === 0}
                        />
                    ))}
                </Stack>
            </Box>
        </Stack>
    );
}

export default EachRouteMap;