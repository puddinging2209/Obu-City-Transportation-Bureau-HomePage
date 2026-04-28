import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Container,
    Typography,
} from "@mui/material";
import { useQueryState } from "nuqs";
import ReactMarkdown from "react-markdown";

import news from "../data/notices.json";

export default function NewsList() {
    const [openId, setOpenId] = useQueryState("id", { 
        defaultValue: null,
        parse: (value) => value ? parseInt(value, 10) : null,
        serialize: (value) => value?.toString() ?? ""
    });

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                お知らせ
            </Typography>

            {news.toReversed().map(item => (
                <Accordion
                    key={item.id}
                    disableGutters
                    expanded={openId === item.id}
                    onChange={() => setOpenId(openId === item.id ? null : item.id)}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                {item.date}
                            </Typography>
                            <Typography variant="body1">
                                {item.title}
                            </Typography>
                        </Box>
                    </AccordionSummary>

                    <AccordionDetails>
                        <Box
                            sx={{
                                textAlign: "left",
                                "& h2": { mt: 2, fontSize: "1rem" },
                                "& ul": { pl: 3 },
                            }}
                        >
                            <ReactMarkdown>
                                {item.body}
                            </ReactMarkdown>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Container>
    );
}
