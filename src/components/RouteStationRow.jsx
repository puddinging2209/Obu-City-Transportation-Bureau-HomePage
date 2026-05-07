import { Box, Stack, Typography } from '@mui/material';

import types from '../data/types.json';

function RouteStationRow({ station, i, stations, lines, isEven }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1.25,
                px: 2,
                bgcolor: isEven ? '#fafafa' : '#fff',
                minHeight: 64,
                minWidth: lines.length * 30 + 48 + 160,
            }}
            fullWidth
        >
            <Box sx={{ position: 'relative', width: lines.length * 30 + 48, flexShrink: 0, height: '100%', display: 'flex', justifyContent: 'center' }} fullWidth>
                {lines.map((line, j) => {
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
                                        bgcolor: Object.values(types).find((t) => t.code === line)?.color || '#999',
                                        zIndex: 3,
                                    }}
                                />
                            )}

                            {stopType && (
                                <Box
                                    key={line}
                                    sx={{
                                        position: 'absolute',
                                        left: j * 30,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        bgcolor: '#fff',
                                        border: `3px solid ${Object.values(types).find((t) => t.code === line)?.color || '#999'}`,
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
                                        bgcolor: Object.values(types).find((t) => t.code === line)?.color || '#999',
                                        zIndex: 3,
                                    }}
                                />
                            )}
                        </>
                    );
                })}
            </Box>
            <Stack sx={{ flex: 1, ml: 2, minWidth: 0, overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {station.name}
                </Typography>
            </Stack>
            {station.connection && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {station.connection}
                </Typography>
            )}
        </Box>
    );
}

export default RouteStationRow;
