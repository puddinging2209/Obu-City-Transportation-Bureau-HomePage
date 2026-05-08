import { Box, Button, Stack, Typography } from '@mui/material';

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
            <Stack sx={{ flex: 1, ml: 2, minWidth: 0, overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {station.name}
                </Typography>
            </Stack>
            {station.connection?.length > 0 && (
                <Stack direction="column" sx={{ ml: 2, flexShrink: 0 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'left' }}>
                        乗換：
                    </Typography>
                    <Stack direction="row" sx={{ mt: 0.5 }}>
                        {station.connection?.map((line) => (
                            <Button key={line} sx={{ color: 'text.secondary', ml: 1 }}>
                                {line}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Box>
    );
}

export default RouteStationRow;
