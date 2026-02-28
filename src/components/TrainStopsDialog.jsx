import React from 'react';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Tab, Tabs, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import StopRow from './StopRow.jsx';

import formatStops from '../utils/formatStops.js';
import { name } from '../utils/Station.js';
import { LineContext } from './DepartureCard.jsx';

import types from '../data/types.json';

export default function TrainStopsDialog({ dep, line, isShow, onClose, emphasized = [] }) {

    const l = line ?? React.useContext(LineContext);

    const [stops, setStops] = React.useState([]);
    const [multilayer, setMultilayer] = React.useState(0);
    
    React.useEffect(() => {
        if (isShow) {
            if (!dep.multilayer) {
                formatStops(l, dep.train).then(s => {
                    setStops(s);
                });
            } else {
                formatStops(l, dep.train[multilayer]).then(s => {
                    setStops(s);
                });
            }
        }
    }, [isShow, multilayer]);
    
    const [isShowContacts, setIsShowContacts] = React.useState(false);
    const [contacts, setContacts] = React.useState([]);

    React.useEffect(() => {
        if (isShowContacts) {
            setContacts(
                stops.flatMap(stop => stop.contacts?.length > 0 ? { contacts: stop.contacts, name: stop.name } : [])
            );
            console.log(stops.flatMap(stop => stop.contacts?.length > 0 ? { contacts: stop.contacts, name: stop.name } : []));
        }
    }, [isShowContacts]);

    if (!dep || !l) return null;

    function scrollToDep() {
        const el = document.getElementsByClassName('emphasized')[0];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

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
            <Dialog
                open={isShow}
                onClose={onClose}
                TransitionProps={{ onEntered: scrollToDep }}
                scroll="paper"  
                fullWidth
            >
                <DialogTitle sx={{ pb: (dep.multilayer ? 0 : '') }}>
                    {isShow && (
                        <Box sx={{ borderBottom: `3px solid ${types[dep.typeName].color}` }}>
                            <Typography variant="h6">
                                {!dep.multilayer ?
                                    `${dep.typeName}${dep.train.name.replace(dep.typeName, '')} ${(dep.train.count != '') ? `${dep.train.count}号` : ''} ${name(dep.terminal)}行` : 
                                    `${dep.typeName}${dep.train[multilayer].name.replace(dep.typeName, '')} ${(dep.train[multilayer].count != '') ? `${dep.train[multilayer].count}号` : ''} ${name(dep.terminal)}行`
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
                    {stops?.map(stop => {
                        const isEmphasized = emphasized.map(s => name(s)).includes(stop.name);
                        return (
                            <StopRow
                                key={`${stop.name}${stop.dep ?? 'pass'}`}
                                stop={stop}
                                emphasized={isEmphasized}
                                className={isEmphasized ? 'emphasized' : ''}
                                onOpenContacts={() => {
                                    setIsShowContacts(true);
                                }}
                            />
                        )
                    })}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>閉じる</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isShowContacts} onClose={() => setIsShowContacts(false)}>
                <DialogTitle>接続列車</DialogTitle>
                <DialogContent dividers>
                    {contacts.map((contact, index) => (
                        <>
                            <Typography key={index} variant="subtitle1">{contact.name}駅</Typography>
                            {contact.contacts.map((c, i) => (
                                <Typography key={i} variant="body2">{`${c.typeName} ${c.terminal}行`}</Typography>
                            ))}
                        </>
                    ))}
                </DialogContent>
            </Dialog>
        </>
    )
}