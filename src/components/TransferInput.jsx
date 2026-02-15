import React from "react";

import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";

import SettingsIcon from "@mui/icons-material/Settings";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Slider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { code } from "../utils/Station.js";
import StationSelecter, { StationSelectButtons } from "./StationSelecter.jsx";

import nodes from "../data/nodes.json";
import stations from "../data/stations.json";

export default function TransferInput({ onSearch, loading }) {
    const { search } = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [from, setFrom] = React.useState(null);
    const [to, setTo] = React.useState(null);
    const [timeType, setTimeType] = React.useState("departure");
    const [time, setTime] = React.useState(dayjs());
    const [openOption, setOpenOption] = React.useState(false);
    const [tokkyu, setTokkyu] = React.useState(false);
    const [allowOuterTransfer, setAllowOuterTransfer] = React.useState(true);
    const [transferTime, setTransferTime] = React.useState(30);

    function toSeconds(time) {
        return Number(time.format('HH')) * 3600 + Number(time.format('mm')) * 60 + Number(time.format('ss'));
    }

    function toSelecterOption(stationCode) {
        const stationName = nodes[stationCode]?.name;
        if (!stationName) return null;
        return { label: stationName, value: stationName, kana: stations[stationName]?.kana || '' };
    }

    React.useEffect(() => {
        const query = new URLSearchParams(search);
        const queryFrom = query.get('from');
        const queryTo = query.get('to');
        const queryTime = Number(query.get('time'));
        const queryMode = Number(query.get('mode'));
        const queryTransferTime = Number(query.get('transferTime'));
        const queryTokkyu = query.get('tokkyu');
        const queryAllowOuterTransfer = query.get('allowOuterTransfer');
        if (!queryFrom || !queryTo || !queryTime || !queryMode === undefined) return;

        setFrom(toSelecterOption(queryFrom));
        setTo(toSelecterOption(queryTo));

        const t = dayjs().startOf('day').add(queryTime, 'second');
        setTime(t);

        if (queryMode === 0) setTimeType('departure');
        else if (queryMode === 1) setTimeType('arrival');
        else setTimeType('departure');

        setTransferTime(queryTransferTime);
        setTokkyu(queryTokkyu === 'true');
        setAllowOuterTransfer(queryAllowOuterTransfer === 'true');
        console.log({queryFrom, queryTo, queryTime, queryMode, queryTokkyu, queryAllowOuterTransfer});
        onSearch(queryFrom, queryTo, queryTime, queryMode, queryTransferTime, queryTokkyu === 'true', queryAllowOuterTransfer === 'true');
    }, []);

    function queryChange(time, mode, tokkyu, allowOuterTransfer) {
        const params = new URLSearchParams();
        if (from) params.append('from', code(from.value)[0]);
        if (to) params.append('to', code(to.value)[0]);
        if (time) params.append('time', time);
        if (mode !== undefined) params.append('mode', mode);
        if (transferTime !== undefined) params.append('transferTime', transferTime);
        if (tokkyu !== undefined) params.append('tokkyu', tokkyu);
        if (allowOuterTransfer !== undefined) params.append('allowOuterTransfer', allowOuterTransfer);
        navigate(`/transfer?${params.toString()}`);
    }

    function handleSearch() {
        let mode;
        let t = toSeconds(time);
        if (timeType === "departure") mode = 0;
        else if (timeType === "arrival") mode = 1;
        else if (timeType === "first") {
            mode = 0;
            t = 10800;
        } else if (timeType === "last") {
            mode = 1;
            t = 10799;
        }

        queryChange(t, mode, tokkyu, allowOuterTransfer);
        onSearch(code(from?.value)[0], code(to?.value)[0], t, mode, transferTime, tokkyu, allowOuterTransfer);
    };

    function handleSwap() {
        setFrom(to);
        setTo(from);
    };

    return (
        <Box
            sx={{
                maxWidth: 720,
                mx: "auto",
                p: isMobile ? 2 : 3,
            }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                乗換案内
            </Typography>

      {/* 出発・到着 */}
            <Stack direction="row" spacing={1} alignItems="center">
                <Stack flexGrow={1} spacing={2.5}>
                    <Stack spacing={0.5}>
                        <StationSelecter onChange={(value) => setFrom(value)} value={from} placeholder="出発駅を選択" busStop={false} disabledStations={[to?.value]} />
                        <StationSelectButtons disabledStations={[to?.value]} onSelect={(value) => setFrom({ value: value, label: value, role: 'station', kana: stations[value].kana })} />
                    </Stack>
                    <Stack spacing={0.5}>
                        <StationSelecter onChange={(value) => setTo(value)} value={to} placeholder="到着駅を選択" busStop={false} disabledStations={[from?.value]} />
                        <StationSelectButtons disabledStations={[from?.value]} onSelect={(value) => setTo({ value: value, label: value, role: 'station', kana: stations[value].kana })} />
                    </Stack>
                </Stack>
                <IconButton
                aria-label="入れ替え"
                onClick={handleSwap}
                sx={{ alignSelf: "center" }}
                >
                    <SwapVertIcon />
                </IconButton>
            </Stack>

      {/* 時刻設定 */}
            <Box sx={{ mt: { xs: 2, md: 3 } }}>
                <ToggleButtonGroup
                value={timeType}
                exclusive
                onChange={(_, v) => v && setTimeType(v)}
                size={isMobile ? "small" : "medium"}
                fullWidth
                >
                    <ToggleButton value="departure">出発</ToggleButton>
                    <ToggleButton value="arrival">到着</ToggleButton>
                    <ToggleButton value="first">初電</ToggleButton>
                    <ToggleButton value="last">終電</ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{ mt: { xs: 1, md: 2 }, display: { xs: "block", md: "flex" }, gap: 1 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker
                            label="時刻を選択"
                            value={time}
                            onChange={(newValue) => setTime(newValue)}
                            ampm={false}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    sx: { mt: 2 },
                                },
                            }}
                            fullWidth
                            format="HH:mm"
                            sx={{ mt: 2 }}
                            disabled={timeType !== "departure" && timeType !== "arrival"}
                        />
                    </LocalizationProvider>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                        <Button size={isMobile ? "small" : "medium"} sx={{ whiteSpace: 'nowrap' }} onClick={() => setTime(dayjs().subtract(5, 'minute'))} disabled={timeType !== "departure" && timeType !== "arrival"}>5分前</Button>
                        <Button size={isMobile ? "small" : "medium"} sx={{ whiteSpace: 'nowrap' }} onClick={() => setTime(dayjs())} disabled={timeType !== "departure" && timeType !== "arrival"}>現在時刻</Button>
                        <Button size={isMobile ? "small" : "medium"} sx={{ whiteSpace: 'nowrap' }} onClick={() => setTime(dayjs().add(5, 'minute'))} disabled={timeType !== "departure" && timeType !== "arrival"}>5分後</Button>
                    </Box>
                </Box>
            </Box>

      {/* オプション */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Button
                    startIcon={<SettingsIcon />}
                    onClick={() => setOpenOption(true)}
                    sx={{ px: 2, whiteSpace: 'nowrap', width: 'fit-content' }}
                >
                    オプション
                </Button>

                <Button
                    onClick={handleSearch}
                    disabled={!from || !to}
                    variant="contained"
                    size={isMobile ? "medium" : "large"}
                    loading={loading}
                    fullWidth
                >
                    検索
                </Button>
            </Box>

      {/* オプションダイアログ */}
            <Dialog open={openOption} onClose={() => setOpenOption(false)} fullWidth>
                <DialogTitle>検索オプション</DialogTitle>
                <DialogContent dividers>
                    {/* ここに後からオプションを追加しやすい構造 */}
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            <FormControlLabel
                                control={<Checkbox />}
                                onChange={e => setTokkyu(e.target.checked)}
                                checked={tokkyu}
                                label="有料列車を利用する"
                            />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <FormControlLabel
                                control={<Checkbox />}
                                onChange={e => setAllowOuterTransfer(!e.target.checked)}
                                checked={!allowOuterTransfer}
                                label="改札外乗り換えを許可しない"
                            />
                        </Typography>
                        <Stack>
                            <Typography variant="body2" color="text.secondary">
                                乗り換え時間(秒)
                            </Typography>
                            <Slider
                                value={transferTime}
                                onChange={(_, v) => setTransferTime(v)}
                                defaultValue={30}
                                valueLabelDisplay="auto"
                                shiftStep={30}
                                step={15}
                                marks
                                min={15}
                                max={120}
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenOption(false)}>閉じる</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
