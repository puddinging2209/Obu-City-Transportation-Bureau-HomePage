import {
    Box,
    Button,
    Grid,
    Stack,
    Typography
} from '@mui/material';

import OverflowMarquee from './OverflowMarquee.jsx';

import { name } from '../utils/Station.js';
import { toTimeString } from '../utils/Time.js';

import lines from '../data/lines.json';


function StopRow({ stop, emphasized = false, className = '', onOpenContacts }) {

    return (
        <div className={className}>
            <Box
                sx={{
                    borderLeft: `4px solid ${lines[stop.lineName].color ?? '#000000'}`,
                    
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
                    <Grid sx={{ flex: '0 0 auto' }}>
                        <Box
                            sx={{
                                textAlign: 'left',
                                flex: '1 1 auto',
                                width: '100%',
                            }}
                        >
                            <Typography variant="body1" component="div"><OverflowMarquee text={name(stop.name)} /></Typography>
                        </Box>
                    </Grid>

                    <Grid sx={{ flex: '0 0 auto' }}>
                        {stop.contacts && stop.contacts.length > 0 && (
                            <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={onOpenContacts}>
                                <Typography variant="body2">
                                    接続列車
                                </Typography>
                            </Button>
                        )}
                    </Grid>

                    <Stack direction="row" sx={{ width: 'fit-content', alignItems: 'right' }}>
                        {stop.stopType == 'stop' ? (
                            <Grid container spacing={2}>
                                {/* 到着時刻 */}
                                <Grid
                                    sx={{
                                        flex: '0 0 42px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography variant="body2" fontWeight="bold">
                                        {(stop.arr != null) ? toTimeString(stop.arr) : ''}
                                    </Typography>
                                </Grid>

                                {/* 発車時刻 */}
                                <Grid
                                    sx={{
                                        flex: '0 0 42px',
                                        textAlign: 'center',
                                    }}
                                    >
                                    <Typography variant="body2" fontWeight="bold">
                                        {(stop.dep != null) ? toTimeString(stop.dep) : ''}
                                    </Typography>
                                </Grid>
                            </Grid>
                        ) : (
                            <Box sx={{ width: '42px', textAlign: 'center' }}>
                                <Typography variant="body2">通過</Typography>
                            </Box>
                        )}
                    </Stack>
                </Grid>
            </Box>
        </div>
    );
}

export default StopRow;