import React from 'react';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import DepartureRow from './DepartureRow.jsx';

import { nowsecond } from '../utils/Time.js';
import { StationContext } from './DepartureCard.jsx';

export default function DepartureListDialog({ departures, isOpen, onClose, direction }) {

    const station = React.useContext(StationContext);
        
    function scrollToDep() {
        const next = departures.find(dep => dep.time > nowsecond());
        if (!next) return;
        const el = document.getElementById(String(next.time));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            scroll="paper"
            TransitionProps={{ onEntered: scrollToDep }}
            fullWidth
        >
            <DialogTitle>
                {isOpen && (
                    <>
                        <Typography variant="h6" component="div">{station.name}</Typography>
                        <Typography variant="subtitle1" component="div">{`${direction?.stationName} 方面`}</Typography>
                    </>
                )}
            </DialogTitle>
            <DialogContent dividers>
                <Box>
                    {departures?.map(dep => (
                        <DepartureRow needId={true} key={dep.time} dep={dep} station={station.name} />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>閉じる</Button>
            </DialogActions>
        </Dialog>
    );
}