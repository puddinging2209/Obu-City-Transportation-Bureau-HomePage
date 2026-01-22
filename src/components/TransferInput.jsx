import React from "react";

import dayjs from "dayjs";

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
import StationSelecter from "./StationSelecter.jsx";

export default function TransferSearchUI({ onSearch, loading }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [from, setFrom] = React.useState("");
    const [to, setTo] = React.useState("");
    const [timeType, setTimeType] = React.useState("departure");
    const [time, setTime] = React.useState(dayjs());
    const [openOption, setOpenOption] = React.useState(false);
    const [tokkyu, setTokkyu] = React.useState(false);

    function toSeconds(time) {
        return Number(time.format('HH')) * 3600 + Number(time.format('mm')) * 60 + Number(time.format('ss'));
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

        onSearch(code(from)[0], code(to)[0], t, mode, tokkyu);
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
                <Stack spacing={1} flex={1}>
                    <StationSelecter onChange={(value) => setFrom(value.value)} placeholder="出発駅を選択" busStop={false} disabledStations={[to]} />
                    <StationSelecter onChange={(value) => setTo(value.value)} placeholder="到着駅を選択" busStop={false} disabledStations={[from]} />
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
            <Box sx={{ mt: 3 }}>
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

                <Box sx={{ mt: 3, display: { xs: "block", md: "flex" }, gap: 1 }}>
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
                        <Button sx={{ whiteSpace: 'nowrap' }} onClick={() => setTime(dayjs().subtract(5, 'minute'))}>5分前</Button>
                        <Button sx={{ whiteSpace: 'nowrap' }} onClick={() => setTime(dayjs())}>現在時刻</Button>
                        <Button sx={{ whiteSpace: 'nowrap' }} onClick={() => setTime(dayjs().add(5, 'minute'))}>5分後</Button>
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
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenOption(false)}>閉じる</Button>
                </DialogActions>
            </Dialog>
    </Box>
  );
}
