import React from "react";

import { Button, Stack, Typography } from "@mui/material";
import { useQueryState } from "nuqs";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import EachRouteMap from "../components/EachRouteMap";
import RouteSelector from "../components/RouteSelector";

import lines from "../data/lines.json";
import operationalRoutes from "../data/operationalRoutes.json";

const routeList = Object.values(operationalRoutes);
const routeById = routeList.reduce((acc, route) => {
    acc[route.id] = route;
    return acc;
}, {});
const defaultRouteId = routeList[0]?.id || '';

function RouteMap() {
    const [isOpenLightbox, setIsOpenLightbox] = React.useState(false);
    const [selectedLine, setSelectedLine] = useQueryState('line', defaultRouteId, {
        serialize: (value) => value,
        parse: (value) => value
    });
    const [imageSize, setImageSize] = React.useState('');

    React.useEffect(() => {
        const fetchImageSize = async () => {
            try {
                const response = await fetch(import.meta.env.BASE_URL + 'routeMap/202605.png', { method: 'HEAD' });
                const size = response.headers.get('content-length');
                if (size) {
                    const sizeInMB = (parseInt(size) / (1024 * 1024)).toFixed(1);
                    setImageSize(` (${sizeInMB}MB)`);
                }
            } catch (error) {
                console.error('Failed to fetch image size:', error);
            }
        };
        fetchImageSize();
    }, []);

    const resolveRouteId = (routeIdOrLineName) => {
        if (routeById[routeIdOrLineName]) {
            return routeIdOrLineName;
        }

        const found = routeList.find((route) => route.segments[0]?.line === routeIdOrLineName);
        return found ? found.id : defaultRouteId;
    };

    const handleLineChange = (routeIdOrLineName) => {
        setSelectedLine(resolveRouteId(routeIdOrLineName));
    };

    const selectedRoute = routeById[resolveRouteId(selectedLine)];
    const line = selectedRoute?.segments?.[0] ? lines[selectedRoute.segments[0].line] : null;

    const buildRouteStations = (route) => {
        if (!route?.segments || route.segments.length === 0) {
            if (!line || !line.stations) {
                return [];
            }
            return line.stations;
        }

        const mergedStations = [];

        route.segments.forEach((segment) => {
            const segmentLine = lines[segment.line];
            if (!segmentLine?.stations) {
                return;
            }

            const segmentStations = segmentLine.stations;
            const startIndex = segment.startAt ? segmentStations.findIndex((station) => station.name === segment.startAt) : 0;
            const endIndex = segment.endAt ? segmentStations.findIndex((station) => station.name === segment.endAt) : segmentStations.length - 1;
            if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
                return;
            }

            const slice = segmentStations.slice(startIndex, endIndex + 1);
            if (mergedStations.length > 0 && mergedStations[mergedStations.length - 1]?.name === slice[0]?.name) {
                // 接続駅: types データをマージ（true を優先）
                const lastStation = mergedStations[mergedStations.length - 1];
                const currentStation = slice[0];
                
                if (lastStation.types && currentStation.types) {
                    const mergedTypes = { ...lastStation.types };
                    Object.entries(currentStation.types).forEach(([key, value]) => {
                        if (value === true) {
                            mergedTypes[key] = true;
                        } else if (value !== null && mergedTypes[key] === null) {
                            mergedTypes[key] = value;
                        }
                    });
                    lastStation.types = mergedTypes;
                }
                
                mergedStations.push(...slice.slice(1));
            } else {
                mergedStations.push(...slice);
            }
        });

        if (mergedStations.length > 0) {
            return mergedStations;
        }

        if (!line || !line.stations) {
            return [];
        }
        return line.stations;
    };

    const stations = React.useMemo(() => buildRouteStations(selectedRoute), [line, selectedRoute]);

    return (
        <div style={{ alignItems: 'center' }}>
            <Typography variant="h6">路線図</Typography>
            <Stack sx={{ width: { xs: '100%', md: '70%' }, overflowX: 'auto', mx: 'auto' }}>
                <Button variant="contained" size="large" onClick={() => setIsOpenLightbox(true)} sx={{ mt: 2 }}>
                    全線路線図を表示
                </Button>
                <Button variant="outlined" size="large" onClick={() => {
                    const link = document.createElement('a');
                    link.href = import.meta.env.BASE_URL + 'routeMap/202605.png';
                    link.download = '大府市営地下鉄全線.png';
                    link.click();
                }} sx={{ mt: 2 }}>
                    全線路線図をダウンロード{imageSize}
                </Button>
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
            <RouteSelector routes={routeList} selected={selectedLine} onLineChange={handleLineChange} />
            <EachRouteMap line={line} stations={stations} route={selectedRoute} onClick={(route) => handleLineChange(route)} />
        </div>
    );
}

export default RouteMap;
