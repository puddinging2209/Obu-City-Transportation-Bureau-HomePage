import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Container,
    Typography,
} from "@mui/material";
import ReactMarkdown from "react-markdown";

import news from "../data/notices.json";

export default function NewsList() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        お知らせ
      </Typography>

      {news.toReversed().map(item => (
        <Accordion key={item.id} disableGutters>
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
