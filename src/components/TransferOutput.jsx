import React from 'react';

import {
    Box,
    Button,
    Card,
    CardContent,
    Typography
} from '@mui/material';

import { toTime, toTimeString } from '../utils/Time';
import TrainStopsDialog from './TrainStopsDialog';

import lines from '../data/lines.json';

/**
 * segments: Array<{
 *   from: string
 *   to: string
 *   depTime: number
 *   arrTime: number
 *   typeName: string
 *   terminal: string
 *   line: string
 * }>
 */
export default function TransferOutput({ segments }) {
    if (!segments || segments.length === 0) return null;

    const [showDialog, setShowDialog] = React.useState(false);
    const [pushed, setPushed] = React.useState(null);

    const requiredTime = toTime(segments.at(-1).arrTime - segments[0].depTime)

    return (
        <>
            <Card sx={{ width: { xs: "100%", md: "70%" }, mx: "auto", my: 4 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight='bold'>{`${toTimeString(segments[0].depTime)}発 ${toTimeString(segments.at(-1).arrTime)}着`}</Typography>
                    <Typography variant="body1">
                        {requiredTime.h > 0 ?
                            `所要時間：${requiredTime.h}時間 ${requiredTime.m}分` :
                            `所要時間：${requiredTime.m}分`
                        }
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <StationBox depTime={segments[0].depTime} StationName={segments[0].from} disableArrTime={true} />

                        {segments.map((seg, i) => (
                            <div key={seg.depTime}>
                                <Box sx={{ ml: '5%', p: 0.5, pl: '3%', textAlign: 'left', borderLeft: 10, borderColor: lines[seg.line]?.color ?? 'green' }}>
                                    <Typography variant="h6">{`${lines[seg.line]?.show} ${seg.typeName}${seg.train.name.replace(seg.typeName, '')} ${(seg.train.count != '') ? `${seg.train.count}号` : ''}`}</Typography>
                                    <Typography variant="body1">{`${seg.terminal}行`}</Typography>
                                    <Button variant='outlined' size="small" sx={{ mt: 1 }} onClick={() => {
                                        setShowDialog(true);
                                        setPushed(seg);
                                    }}>
                                        停車駅
                                    </Button>
                                </Box>
                                {(i === segments.length - 1 || (seg.train.number !== segments[i + 1]?.train.number || seg.train.number === '')) && (
                                    <StationBox arrTime={seg.arrTime} depTime={segments[i + 1]?.depTime} StationName={seg.to} disableDepTime={i === segments.length - 1} />
                                )}
                            </div>
                        ))}
                    </Box>
                </CardContent>
                <TrainStopsDialog dep={pushed} line={pushed?.line} isShowDialog={showDialog} setIsShowDialog={setShowDialog} />
            </Card>
        </>
  );
}

function StationBox({ arrTime, depTime, StationName, disableArrTime = false, disableDepTime = false }) {
    return (
        <Box sx={{ width: '100%', display: 'flex', p: 1, gap: 1 }} bgcolor="#DDD">
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant='body1'>{disableArrTime ? '出発' : toTimeString(arrTime)}</Typography>
                <Typography variant='body1'>{disableDepTime ? '到着' : toTimeString(depTime)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', verticalAlign: 'middle', px: 1, py: 'auto' }}>
                <Typography variant="h6" fontWeight='bold'>{StationName}</Typography>
            </Box>
        </Box>
    )
}
