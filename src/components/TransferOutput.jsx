import {
    Box,
    Button,
    Card,
    CardContent,
    Typography
} from '@mui/material';

import dayjs from 'dayjs';
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

    return (
        <>
            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight='bold'>{`${segments[0].depTime} 発 ${segments.at(-1).arrTime} 着`}</Typography>
                    <Typography variant="body1">{`所要時間：${dayjs(segments.at(-1).arrTime).diff(dayjs(segments[0].depTime), 'minute')}`}</Typography>

                    <Box sx={{ mt: 2 }}>
                        <StationBox depTime={segments[0].depTime} StationName={segments[0].from} disableArrTime={true} />

                        {segments.map((seg, i) => (
                            <div key={seg.depTime}>
                                <Box sx={{ ml: '5%', p: 0.5, pl: '3%', textAlign: 'left', borderLeft: 10, borderColor: lines[seg.line]?.color ?? 'green' }}>
                                    <Typography variant="h6">{`${seg.line} ${seg.typeName}`}</Typography>
                                    <Typography variant="body1">{`${seg.terminal}行`}</Typography>
                                    <Button variant='outlined' size="small" sx={{ mt: 1 }}>停車駅</Button>
                                </Box>
                                <StationBox arrTime={seg.arrTime} depTime={segments[i + 1]?.depTime} StationName={seg.to} disableDepTime={i === segments.length - 1} />
                            </div>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </>
  );
}

function StationBox({ arrTime, depTime, StationName, disableArrTime = false, disableDepTime = false }) {
    return (
        <Box sx={{ width: '100%', display: 'flex', p: 1, gap: 1 }} bgcolor="#DDD">
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant='body1'>{disableArrTime ? '出発' : arrTime}</Typography>
                <Typography variant='body1'>{disableDepTime ? '到着' : depTime}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', verticalAlign: 'middle', px: 1, py: 'auto' }}>
                <Typography variant="h6">{StationName}</Typography>
            </Box>
        </Box>
    )
}
