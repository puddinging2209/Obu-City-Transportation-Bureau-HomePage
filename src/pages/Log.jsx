import dayjs from "dayjs";

import {
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

export default function Log() {
    const logs = JSON.parse(localStorage.getItem('visitedStations') || '[]').toReversed();
    return (
        <>
            <Typography variant="h6">駅ログ！</Typography>
            <Card sx={{ width: { xs: "100%", md: "70%" }, mx: "auto", my: 4, p: 2 }}>
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
        </>
    )
}