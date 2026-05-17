import { Box, Stack, Typography } from '@mui/material';

import { getOperationalStationsMap } from '../utils/operationalRoutesCache';

import operationalRoutes from '../data/operationalRoutes.json';
import types from '../data/types.json';

function RouteStationRow({ i, line, stations, lines, onClick, selectedRouteId }) {
    const station = stations[i];
    const isEven = i % 2 === 0;
    // operationalRoutes に基づくマージ済み駅リストから乗り換えを判定
    const operationalMap = getOperationalStationsMap();
    const transferRoutes = Object.entries(operationalMap).filter(([routeId, opStations]) => {
        if (routeId === selectedRouteId) return false;
        const indexInOp = opStations.findIndex(s => s.name === station.name);
        if (indexInOp === -1) return false;

        const prevOp = opStations[indexInOp - 1]?.name;
        const nextOp = opStations[indexInOp + 1]?.name;

        return (
            prevOp != null && !stations.map(s => s.name).includes(prevOp)
        ) || (
            nextOp != null && !stations.map(s => s.name).includes(nextOp)
        );
    }).map(([routeId]) => routeId);

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
                width: '100%',
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
                        <div key={`${line}div`}>
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

                            {(stopType === true || stopType === 'some') && !(preStopType === null && nextStopType === null) && (
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
                        </div>
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
                                        {operationalRoutes[route]?.label || route}
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
