import React from 'react';

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';

import { name } from '../utils/Station.js';
import { toTimeString } from '../utils/Time.js';
import formatStops from '../utils/formatStops.js';

import OverflowMarquee from './OverflowMarquee.jsx';
import StopRow from './StopRow.jsx';

import types from '../data/types.json';

import { LineContext, StationContext } from './DepartureCard.jsx';

function DepartureRow({ dep, needId = false }) {

    const station = React.useContext(StationContext);

    const line = React.useContext(LineContext);

    const [stops, setStops] = React.useState([]);

    React.useEffect(() => {
        formatStops(line, dep.train).then(stops => setStops(stops));
    }, [line]);

    const [isShowDialog, setIsShowDialog] = React.useState(false);

    return (
        <>
            <Box
                id={needId ? String(dep.time) : null}
                sx={{
                    borderBottom: '1px solid rgba(0,0,0,0.12)',
                    py: '3px',
                }}
                onClick={() => {
                    setIsShowDialog(true);
                }}
            >
                <Grid
                    container
                    wrap="nowrap"
                    alignItems="center"
                    columnGap={0.5}
                >
                    {/* 種別 */}
                    <Grid item sx={{ flex: '0 0 auto' }}>
                    <Chip
                        label={dep.typeName}
                        size="small"
                        sx={{
                        background: types[dep.typeName].color,
                        color: '#fff',
                        fontSize: '0.75em',
                        minWidth: '8.5em',
                        px: 0.8,
                        }}
                    />
                    </Grid>

                    {/* 行先（残り全部） */}
                    <Grid
                    item
                    sx={{
                        textAlign: 'center',
                        flex: '1 1 auto',
                        minWidth: 0, // ← 超重要
                    }}
                    >
                    <Box
                        sx={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        }}
                    >
                        <OverflowMarquee text={name(dep.terminal)} />
                    </Box>
                    </Grid>

                    {/* 時刻（固定） */}
                    <Grid
                    item
                    sx={{
                        flex: '0 0 42px',
                        textAlign: 'right',
                    }}
                    >
                    <Typography variant="body2" fontWeight="bold">
                        {toTimeString(dep.time)}
                    </Typography>
                    </Grid>
                </Grid>
            </Box>

            <Dialog
                open={isShowDialog}
                onClose={() => {
                    setIsShowDialog(false);
                }}
                scroll="paper"  
                fullWidth
            >
                <DialogTitle>
                    {isShowDialog && (
                        <>
                            <Typography graphy variant="h6">{`${dep.typeName} ${name(dep.terminal)}行`}</Typography>
                        </>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid
                        container
                        wrap="nowrap"
                        alignItems="center"
                        columnGap={0.5}
                        sx={{ justifyContent: 'space-between' }}
                    >
                        <Grid item sx={{ flex: '0 0 auto' }}>
                            <Box
                                sx={{
                                    textAlign: 'left',
                                    flex: '1 1 auto',
                                    width: '100%',
                                }}
                            >
                                <Typography variant="body1">駅</Typography>
                            </Box>
                        </Grid>
                        <Grid spacing={2} container>
                            {/* 到着時刻 */}
                            <Grid
                            item
                            sx={{
                                flex: '0 0 42px',
                                textAlign: 'right',
                            }}
                            >
                                <Typography variant="body2" fontWeight="bold">到着時刻</Typography>
                            </Grid>

                            {/* 発車時刻 */}
                            <Grid
                                item
                                sx={{
                                    flex: '0 0 42px',
                                    textAlign: 'right',
                                }}
                                >
                                <Typography variant="body2" fontWeight="bold">発車時刻</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    {stops?.map(stop => (
                        <StopRow needId={true} key={stop.dep} stop={stop} />
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setIsShowDialog(false);
                    }}>閉じる</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default DepartureRow;