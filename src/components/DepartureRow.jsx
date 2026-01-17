import React from 'react';

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Tab, Tabs, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { name } from '../utils/Station.js';
import { adjustTime, nowsecond, toTimeString } from '../utils/Time.js';
import formatStops from '../utils/formatStops.js';

import OverflowMarquee from './OverflowMarquee.jsx';
import StopRow from './StopRow.jsx';

import types from '../data/types.json';

import { LineContext } from './DepartureCard.jsx';

function DepartureRow({ dep, needId = false }) {

    const line = React.useContext(LineContext);

    const [stops, setStops] = React.useState([]);

    const [isShowDialog, setIsShowDialog] = React.useState(false);
    const [multilayer, setMultilayer] = React.useState(0);
    const [time, setTime] = React.useState(null);

    React.useEffect(() => {
        if (isShowDialog) {
            if (!dep.multilayer) {
                formatStops(line, dep.train).then(s => setStops(s));
                setTime(nowsecond());
            } else {
                formatStops(line, dep.train[multilayer]).then(s => {
                    setStops(s)
                });
                setTime(nowsecond());
            }
        }
    }, [isShowDialog, multilayer]);

    // 高さを変更したカスタムTabs
    const StyledTabs = styled(Tabs)({
        minHeight: '32px', // 全体の最小高さを上書き
        height: '32px',    // 高さを固定
    });

    // 高さを変更したカスタムTab
    const StyledTab = styled(Tab)({
        minHeight: '32px', // 各タブの最小高さを上書き
        padding: '6px 12px', // 高さに合わせてパディングを調整
    });

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
                <DialogTitle sx={{ pb: (dep.multilayer ? 0 : '') }}>
                    {isShowDialog && (
                        <Box sx={{ borderBottom: `solid ${types[dep.typeName].color}` }}>
                            <Typography variant="h6">
                                {!dep.multilayer ?
                                    `${dep.typeName}${dep.train.name} ${(dep.train.count != '') ? `${dep.train.count}号` : ''} ${name(dep.terminal)}行` : 
                                    `${dep.typeName}${dep.train[multilayer].name} ${(dep.train[multilayer].count != '') ? `${dep.train[multilayer].count}号` : ''} ${name(dep.terminal)}行`
                                }
                            </Typography>
                            <Typography variant="body1">{!dep.multilayer ? dep.train.number : dep.train[multilayer].number}</Typography>
                        </Box>
                    )}
                    {dep.multilayer &&
                        <Grid sx={{ mt: 0.5 }}>
                            <StyledTabs
                                value={multilayer}
                                onChange={(_, value) => setMultilayer(value)}
                                sx={{ height: 1, borderBottom: '1px solid #e0e0e0' }}
                                centered
                            >
                                {dep.train?.map((_, index) => {
                                    const terminal = dep.terminal.split('・')[index];
                                    return (
                                        <StyledTab label={`${terminal}行`} value={index} key={`${index}${terminal}`} />
                                    )
                                })}
                            </StyledTabs>
                        </Grid>
                    }
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
                        <StopRow key={`${stop.name}${stop.dep ?? 'pass'}`} stop={stop} departed={adjustTime(stop.dep ?? stop.arr) < time} />
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