import {
    Box,
    Button,
    Chip,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import notices from "../data/notices.json";

// category: ["更新", "イベント", "重要"]
// important: trueを設定可能

function NoticeSection() {
    const navigate = useNavigate();
    return (
        <Box sx={{ width: { xs: "100%", md: "70%"}, mx: "auto", my: 4 }}>
            <Paper elevation={1} sx={{ p: 2 }}>
              
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                    variant="h6"
                    sx={{
                        mb: 1.5,
                        pl: 1,
                        borderLeft: "4px solid",
                        borderColor: "text.primary",
                    }}
                    >
                    お知らせ
                    </Typography>

                    <Button size="small" sx={{ alignSelf: "flex-end", mb: 1 }} onClick={() => navigate("/news")}>
                        すべて見る
                    </Button>
                </Stack>

                <List disablePadding>
                    {notices.toReversed().slice(0, 3).map((item) => (
                        <ListItemButton
                            key={`notice-${item.id}`}
                            sx={{
                                py: 1,
                                borderBottom: "1px solid #e0e0e0",
                                "&:last-of-type": {
                                borderBottom: "none",
                                },
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography
                                        variant="body2"
                                        sx={{ minWidth: 90, color: "text.secondary" }}
                                        >
                                        {item.date}
                                        </Typography>

                                        <Chip
                                        label={item.category}
                                        size="small"
                                        color={item.important ? "error" : "default"}
                                        variant={item.important ? "filled" : "outlined"}
                                        sx={{ minWidth: 64 }}
                                        />

                                        <Typography variant="body2">
                                        {item.title}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Paper>
        </Box>
    );
}

export default NoticeSection;
