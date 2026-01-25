import { Box, Grid, Typography } from '@mui/material';

import { name } from '../utils/Station.js';
import { toTimeString } from '../utils/Time.js';

import OverflowMarquee from './OverflowMarquee.jsx';


function StopRow({ stop, departed = false, emphasized = false }) {
    return (
        <>
            <Box
                sx={{
                    borderBottom: '1px solid rgba(0,0,0,0.12)',
                    py: '3px',
                    background: emphasized ? 'rgba(255, 237, 80, 0.5)' : '',
                }}
            >
                <Grid
                    container
                    wrap="nowrap"
                    alignItems="center"
                    columnGap={0.5}
                    sx={{ pl: 1, justifyContent: 'space-between' }}
                >
                    {/* 駅名 */}
                    <Grid item sx={{ flex: '0 0 auto' }}>
                        <Box
                            sx={{
                                textAlign: 'left',
                                flex: '1 1 auto',
                                width: '100%',
                            }}
                        >
                            <Typography variant="body1"><OverflowMarquee text={name(stop.name)} /></Typography>
                        </Box>
                    </Grid>

                    <>
                        {stop.stopType == 'stop' ? (
                            <Grid spacing={2} container>
                                {/* 到着時刻 */}
                                <Grid
                                item
                                sx={{
                                    flex: '0 0 42px',
                                    textAlign: 'center',
                                }}
                                >
                                    <Typography variant="body2" fontWeight={!departed ? "bold" : "normal"}>
                                        {(stop.arr != null) ? toTimeString(stop.arr) : ''}
                                    </Typography>
                                </Grid>

                                {/* 発車時刻 */}
                                <Grid
                                    item
                                    sx={{
                                        flex: '0 0 42px',
                                        textAlign: 'center',
                                    }}
                                    >
                                    <Typography variant="body2" fontWeight={!departed ? "bold" : "normal"}>
                                        {(stop.dep != null) ? toTimeString(stop.dep) : ''}
                                    </Typography>
                                </Grid>
                            </Grid>
                        ) : (
                            <Box sx={{ width: '42px', textAlign: 'center' }}>
                                <Typography variant="body2">通過</Typography>
                            </Box>
                        )}
                    </>
                </Grid>
            </Box>
        </>
    );
}

export default StopRow;