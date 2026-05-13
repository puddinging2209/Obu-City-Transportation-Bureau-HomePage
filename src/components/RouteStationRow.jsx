import { Box, Stack, Typography } from '@mui/material';

import linesData from '../data/lines.json';
import stationData from '../data/stations.json';
import types from '../data/types.json';

function RouteStationRow({ i, line, stations, lines, onClick }) {
    const station = stations[i];
    const isEven = i % 2 === 0;
    const transferRoutes = stationData[station.name].routes.filter(route =>
        route !== line.name &&
        (
            (i - 1 >= 0 && !linesData[route].stations.some(sta => sta.name === stations[i - 1]?.name)) ||
            (i + 1 < stations.length && !linesData[route].stations.some(sta => sta.name === stations[i + 1]?.name))
        )
    );

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1.25,
                px: 2,
                bgcolor: isEven ? '#fafafa' : '#fff',
                minHeight: 64,
                minWidth: 'fit-content',
                width: '100%', //lines.length * 30 + 48 + 160,
                overflow: 'visible',
            }}
            fullWidth
        >
            <Box sx={{
                position: 'relative',
                minWidth: '20vw',
                width: lines.length * 30,
                flexShrink: 0,
                height: '100%',
                display: 'flex',
                justifyContent: 'center'
            }} fullWidth>
                {lines.map((line, j) => {
                    const type = Object.values(types).find((t) => t.code === line);
                    const preStopType = stations[i - 1]?.types?.[line] ?? null;
                    const stopType = station.types?.[line];
                    const nextStopType = stations[i + 1]?.types?.[line] ?? null;
                    return (
                        <>
                            {stopType !== null && preStopType !== null && (
                                <Box
                                    key={`${line}top`}
                                    sx={{
                                        position: 'absolute',
                                        left: 6 + j * 30,
                                        bottom: '50%',
                                        width: 4,
                                        height: 32,
                                        bgcolor: type?.color || '#999',
                                        zIndex: 3,
                                    }}
                                />
                            )}

                            {(stopType === true || stopType === 'some') && (
                                <Box
                                    key={line}
                                    sx={{
                                        position: 'absolute',
                                        left: j * 30 + (stopType === 'some' ? 2 : 0),
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: stopType === true ? 16 : 12,
                                        height: stopType === true ? 16 : 12,
                                        borderRadius: '50%',
                                        bgcolor: stopType === true ? '#fff' : type?.color || '#999',
                                        border: `3px solid ${type?.color || '#999'}`,
                                        zIndex: 4,
                                    }}
                                />
                            )}

                            {stopType !== null && nextStopType !== null && (
                                <Box
                                    key={`${line}bottom`}
                                    sx={{
                                        position: 'absolute',
                                        left: 6 + j * 30,
                                        top: '50%',
                                        width: 4,
                                        height: 32,
                                        bgcolor: type?.color || '#999',
                                        zIndex: 3,
                                    }}
                                />
                            )}
                        </>
                    );
                })}
            </Box>
            <Stack sx={{ ml: 1 }}>
                <Stack sx={{ flex: 1, minWidth: 0, }}>
                    <Typography variant="body1" sx={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {station.name}
                    </Typography>
                </Stack>
                {transferRoutes.length > 0 && (
                    <Stack direction="row" sx={{ mt: 0, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', }}>
                            乗換：
                        </Typography>
                        <Stack direction="row">
                            {transferRoutes.map((route) => (
                                <Box key={route} size="small" sx={{ ml: 1, cursor: 'pointer' }} onClick={() => onClick(route)}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', }}>
                                        {route}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}

export default RouteStationRow;
