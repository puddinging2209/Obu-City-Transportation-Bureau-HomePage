import dayjs from "dayjs";

import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

import stations from '../data/stations.json';

export default function Log() {
    const logs = JSON.parse(localStorage.getItem('visitedStations') || '[]').toReversed();
    const numOfStations = Object.keys(stations).length;
    const checkedStations = new Set(logs.map(log => log.name)).size;

    return (
        <Box sx={{ width: { xs: "100%", md: "70%" }, mx: "auto", my: 4, p: 2 }}>
            <Typography variant="h6">駅ログ！</Typography>
            <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                <Typography variant="body1" sx={{ mt: 1 }}>
                    {`訪問済: ${checkedStations}駅 / ${numOfStations}駅 ${((checkedStations / numOfStations) * 100).toFixed(2)}%`}
                </Typography>
            </Box>
            <Card sx={{ width: "100%", overflow: "auto", mx: "auto", my: 4, p: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>タイムスタンプ</TableCell>
                                <TableCell>駅</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {logs.map((log, i) => (
                            <TableRow
                                key={`${i}-${log.time}`}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell>{dayjs(log.time).format('YYYY/MM/DD HH:mm')}</TableCell>
                                <TableCell>{log.name}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    )
}