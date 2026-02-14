import React from 'react';

import {
    Box,
    Button,
    Card,
    CardContent,
    Typography
} from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';

import { addMyStationAtom, myStationsAtom } from '../utils/Atom.js';
import { toTime, toTimeString } from '../utils/Time.js';
import TrainStopsDialog from './TrainStopsDialog.jsx';

import lines from '../data/lines.json';

/*
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
    
    function copyUrl() {
        const url = window.location.href;
        navigator.clipboard.writeText(url)
            .then(() => {
                alert('リンクをコピーしました！');
            })
            .catch(() => {
                alert('リンクのコピーに失敗しました');
            });
    }

    function searchRideStation(segments, i) {
        const seg = segments[i];
        for (let j = i - 1; j >= 0; j--) {
            if (segments[j].train.number !== seg.train.number || segments[j].train.number === '') {
                return segments[j].to;
            }
        }
        return segments[0].from;
    }

    const innerContinues = [
        { sta: ['大府', '鶴舞'], lines: ['大府環状線', '大府西線', '大高線'] },
        { sta: ['大府', '日進'], lines: ['刈田川線', '内田面線', '長久手線'] },
        { sta: ['惣作', '豊明市'], lines: ['内田面線', '長久手線'] },
    ];

    return (
        <>
            <Card sx={{ width: { xs: "100%", md: "70%" }, mx: "auto", my: 4 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative', mb: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight='bold'>{`${toTimeString(segments[0].depTime)}発 ${toTimeString(segments.at(-1).arrTime)}着`}</Typography>
                            <Typography variant="body1">
                                {requiredTime.h > 0 ?
                                    `所要時間：${requiredTime.h}時間 ${requiredTime.m}分` :
                                    `所要時間：${requiredTime.m}分`
                                }
                            </Typography>
                        </Box>
                        <Box sx={{ position: 'absolute', right: 0, my: 'auto', alignSelf: 'center' }}>
                            <Button variant='outlined' size="medium" onClick={copyUrl}>
                                経路を共有
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <StationBox depTime={segments[0].depTime} StationName={segments[0].from} disableArrTime={true} />

                        {segments.map((seg, i) => {
                            const isContinue = (i > 0) && (seg.train.number === segments[i - 1]?.train.number) && (seg.train.number !== '');
                            const isContinueNext = (i < segments.length - 1) && (seg.train.number === segments[i + 1]?.train.number) && (seg.train.number !== '');
                            return seg.line.map((line, j) => {
                                const isInnerContinue = j !== 0 || isContinue;
                                const isInnerContinueNext = j !== seg.line.length - 1 || isContinueNext;
                                return (
                                    <div key={`${seg.depTime}-${line}`}>
                                        <Box sx={{ ml: '5%', p: 0.5, pl: '3%', textAlign: 'left', borderLeft: 10, borderColor: lines[line]?.color ?? 'green' }}>
                                            {!isInnerContinue &&
                                                <Typography variant="h6">
                                                    {`${seg.typeName}${seg.train.name.replace(seg.typeName, '')} ${(seg.train.count != '') ? `${seg.train.count}号` : ''} ${seg.terminal}行`}
                                                </Typography>
                                            }
                                            <Typography variant="body1">
                                                {`${lines[line]?.show}${isInnerContinue ? '(直通)' : ''} `}
                                            </Typography>
                                            {(!isInnerContinueNext) && (
                                                <Button variant='outlined' size="small" sx={{ mt: 1 }} onClick={() => {
                                                    setShowDialog(true);
                                                    setPushed({ ...seg, from: searchRideStation(segments, i)});
                                                }}>
                                                    停車駅
                                                </Button>
                                            )}
                                        </Box>
                                        {(!isInnerContinueNext) && (
                                            <StationBox arrTime={seg.arrTime} depTime={segments[i + 1]?.depTime} StationName={seg.to} disableDepTime={i === segments.length - 1} />
                                        )}
                                    </div>
                                )
                            })
                        })}
                    </Box>
                </CardContent>
                <TrainStopsDialog
                    dep={pushed}
                    line={pushed?.line[0]}
                    isShowDialog={showDialog}
                    onClose={() => setShowDialog(false)}
                    emphasized={[pushed?.from, pushed?.to]}
                />
            </Card>
        </>
  );
}

function StationBox({ arrTime, depTime, StationName, disableArrTime = false, disableDepTime = false }) {
    const myStations = useAtomValue(myStationsAtom);
    const setMyStations = useSetAtom(addMyStationAtom);

    return (
        <Box sx={{ width: '100%', display: 'flex', borderRadius: 1, p: 1, gap: 1 }} bgcolor="#DDD">
            <Box sx={{ flex: '0 0 42px', textAlign: 'center' }}>
                <Typography variant='body1'>{disableArrTime ? '出発' : toTimeString(arrTime)}</Typography>
                <Typography variant='body1'>{disableDepTime ? '到着' : toTimeString(depTime)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', verticalAlign: 'middle', px: 1, py: 'auto' }}>
                <Typography variant="h6" fontWeight='bold'>{StationName}</Typography>
            </Box>
            <Button
                variant='outlined'
                size="small"
                sx={{ ml: 'auto' }}
                disabled={myStations.map(sta => sta?.name).includes(StationName)}
                onClick={() => setMyStations({name: StationName, role: 'station'})}
            >
                マイ駅に追加
            </Button>
        </Box>
    )
}
