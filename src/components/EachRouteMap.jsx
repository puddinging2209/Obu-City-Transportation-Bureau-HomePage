import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import RouteStationRow from './RouteStationRow';

import typesData from '../data/types.json';

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

        setTypes(Array.from(typeSet).sort((a, b) => Object.values(typesData).findIndex((t) => t.code === a) - Object.values(typesData).findIndex((t) => t.code === b)));
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
                <Stack alignItems="left" direction="row" sx={{
                    position: 'relative',
                    pl: '8px'
                }}>
                    {types.map((type) => (
                        <Box sx={{
                            width: 30,
                            py: 0.2,
                            display: 'flex',
                            alignItems: 'flex-end',
                        }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    writingMode: 'vertical-rl',
                                    fontWeight: 'bold',
                                    color: Object.values(typesData).find((t) => t.code === type)?.color || '#999',
                                }}
                            >
                                {Object.values(typesData).find((t) => t.code === type)?.name || type}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
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