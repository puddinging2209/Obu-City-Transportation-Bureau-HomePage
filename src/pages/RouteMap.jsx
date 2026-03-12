import React from "react";

import { Stack, Typography } from "@mui/material";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

function RouteMap() {
    const [isOpenLightbox, setIsOpenLightbox] = React.useState(false);

    return (
        <>
            <Typography variant="h6">路線図</Typography>
            <Stack sx={{ width: { xs: '100%', md: '70%' }, overflowX: 'auto', mx: 'auto' }}>
                <img
                    src={import.meta.env.BASE_URL + 'routeMap/202603.png'}
                    alt="路線図"
                    style={{ width: '100%', marginTop: '16px', borderRadius: '14px', cursor: 'zoom-in' }}
                    onClick={() => setIsOpenLightbox(true)}
                />
            </Stack>
            <Lightbox
                open={isOpenLightbox}
                close={() => setIsOpenLightbox(false)}
                slides={[{ src: import.meta.env.BASE_URL + 'routeMap/202603.png' }]}
                plugins={[Zoom]}
                carousel={{ finite: true }}
                render={{
                    buttonPrev: () => null,
                    buttonNext: () => null,
                }}
            />
        </>
    )
}

export default RouteMap