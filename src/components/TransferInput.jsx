import React from "react";

import SettingsIcon from "@mui/icons-material/Settings";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import StationSelecter from "./StationSelecter.jsx";

export default function TransferSearchUI() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [timeType, setTimeType] = React.useState("departure");
  const [time, setTime] = React.useState("");
  const [openOption, setOpenOption] = React.useState(false);

  const handleSwap = () => {
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
          <StationSelecter />
          <StationSelecter />
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
          <ToggleButton value="now">現在</ToggleButton>
        </ToggleButtonGroup>

        {(timeType === "departure" || timeType === "arrival") && (
          <TextField
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        )}
      </Box>

      {/* オプション */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
        <Button
          startIcon={<SettingsIcon />}
          onClick={() => setOpenOption(true)}
        >
          オプション
        </Button>

        <Button variant="contained" size={isMobile ? "medium" : "large"}>
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
              ※ 今後ここに「優先（早い／安い／楽）」「徒歩速度」「有料列車を除外」などを追加できます
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
