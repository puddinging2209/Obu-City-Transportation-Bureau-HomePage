import React from "react";

import { Stack, Typography } from "@mui/material";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import EachRouteMap from "../components/EachRouteMap";
import RouteSelector from "../components/RouteSelector";

import lines from "../data/lines.json";

function RouteMap() {
    const [isOpenLightbox, setIsOpenLightbox] = React.useState(false);
    const [selectedLine, setSelectedLine] = React.useState('');

    const handleLineChange = (routeId) => {
        setSelectedLine(routeId);
    };

    return (
        <div style={{ alignItems: 'center' }}>
            <Typography variant="h6">路線図</Typography>
            <Stack sx={{ width: { xs: '100%', md: '70%' }, overflowX: 'auto', mx: 'auto' }}>
                <img
                    src={import.meta.env.BASE_URL + 'routeMap/202605.png'}
                    alt="路線図"
                    style={{ width: '100%', marginTop: '16px', borderRadius: '14px', cursor: 'zoom-in' }}
                    onClick={() => setIsOpenLightbox(true)}
                />
            </Stack>
            <Lightbox
                open={isOpenLightbox}
                close={() => setIsOpenLightbox(false)}
                slides={[{ src: import.meta.env.BASE_URL + 'routeMap/202605.png' }]}
                plugins={[Zoom]}
                carousel={{ finite: true }}
                render={{
                    buttonPrev: () => null,
                    buttonNext: () => null,
                }}
            />
            <RouteSelector lines={lines} selectedLine={selectedLine} onLineChange={handleLineChange} />
            <EachRouteMap line={lines[selectedLine]} />
        </div>
    );
}

export default RouteMap;
