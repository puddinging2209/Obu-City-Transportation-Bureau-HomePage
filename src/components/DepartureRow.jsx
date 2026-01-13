import React from 'react';

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';

import { name } from '../utils/Station.js';
import { nowsecond, toTimeString } from '../utils/Time.js';
import formatStops from '../utils/formatStops.js';

import OverflowMarquee from './OverflowMarquee.jsx';
import StopRow from './StopRow.jsx';

import types from '../data/types.json';

import { LineContext } from './DepartureCard.jsx';

function DepartureRow({ dep, needId = false }) {

    const line = React.useContext(LineContext);

    const [stops, setStops] = React.useState([]);

    const [isShowDialog, setIsShowDialog] = React.useState(false);
    const [time, setTime] = React.useState(null);

    React.useEffect(() => {
        if (isShowDialog) {
            formatStops(line, dep.train).then(stops => setStops(stops));
            setTime(nowsecond());
        }
    }, [isShowDialog]);

    return (
        <>
            <Box
                id={needId ? String(dep.time) : null}
                sx={{
                    borderBottom: '1px solid rgba(0,0,0,0.12)',
                    py: '3px',
                    cursor: 'pointer',
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
                        <Box sx={{ borderBottom: `solid ${types[dep.typeName].color}` }}>
                            <Typography graphy variant="h6">{`${dep.typeName}${dep.train.name} ${(dep.train.count != '') ? `${dep.train.count}号` : ''} ${name(dep.terminal)}行`}</Typography>
                        </Box>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid
                        container
                        wrap="nowrap"
                        alignItems="center"
                        columnGap={0.5}
                        gap={2}
                        sx={{ justifyContent: 'flex-end' }}
                    >
                        <Grid
                            item
                            sx={{
                                flex: '0 0 42px',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="body2" fontWeight="bold">到着</Typography>
                        </Grid>

                        <Grid
                            item
                            sx={{
                                flex: '0 0 42px',
                                textAlign: 'center',
                            }}
                            >
                            <Typography variant="body2" fontWeight="bold">発車</Typography>
                        </Grid>
                    </Grid>
                    {stops?.map(stop => (
                        <StopRow key={stop.dep} stop={stop} departed={(stop.dep ?? stop.arr) < time} />
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