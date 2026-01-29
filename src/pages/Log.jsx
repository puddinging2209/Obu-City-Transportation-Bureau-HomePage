import React from "react";

import dayjs from "dayjs";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Card,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography
} from "@mui/material";

import lines from '../data/lines.json';
import stations from '../data/stations.json';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {children}
        </Box>
    );
}

export default function Log() {

    const [mode, setMode] = React.useState(0);

    const logs = JSON.parse(localStorage.getItem('visitedStations') || '[]').toReversed();
    const numOfStations = Object.keys(stations).length;
    const checkedStations = new Set(logs.map(log => log.name)).size;

    const subwayLines = Object.values(lines).filter(line => line.type === 'subway');

    return (
        <Box sx={{ width: { xs: "100%", md: "70%" }, mx: "auto", my: 4, p: 2 }}>
            <Typography variant="h6">駅ログ！</Typography>
            <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                <Typography variant="body1" sx={{ mt: 1 }}>
                    {`訪問済: ${checkedStations}駅 / ${numOfStations}駅 ${((checkedStations / numOfStations) * 100).toFixed(2)}%`}
                </Typography>
            </Box>
            <Box>
                <Tabs value={mode} onChange={(_, v) => setMode(v)}>
                    <Tab label="履歴一覧" value={0} />
                    <Tab label="路線別" value={1} />
                </Tabs>
            </Box>
            <TabPanel value={mode} index={0}>
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
            </TabPanel>
            <TabPanel value={mode} index={1}>
                <Card sx={{ width: "100%", overflow: "auto", mx: "auto", my: 4, p: 2 }}>
                    {subwayLines.map((line) => {
                        const innerStations = new Set(line.stations);
                        return (
                            <Accordion key={line.name}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                >
                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1">{line.name}</Typography>
                                        <Typography variant="body1">{`訪問済: ${logs.filter(log => innerStations.has(log.name)).length} 駅 / ${innerStations.size} 駅`}</Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>駅</TableCell>
                                                    <TableCell>訪問履歴</TableCell>
                                                    <TableCell>訪問回数</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...innerStations].map((station, i) => (
                                                    <TableRow key={`${line.name}${station}`}>
                                                        <TableCell>{station}</TableCell>
                                                        <TableCell>
                                                            {logs.some(log => log.name === station) ?
                                                                <>
                                                                    {`最終訪問 : ${dayjs(logs.sort((log1, log2) => log2.time - log1.time).find(log => log.name === station).time).format('YYYY/MM/DD HH:mm')}`}
                                                                </>
                                                                :
                                                                '未訪問'
                                                            }
                                                        </TableCell>
                                                        <TableCell>{`${logs.filter(log => log.name === station).length} 回`}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Card>
            </TabPanel>
        </Box>
    )
}