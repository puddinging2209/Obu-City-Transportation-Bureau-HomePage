import lines from '../data/lines.json';

export default function buildRouteStations(route, linesData = lines) {
    if (!route?.segments || route.segments.length === 0) {
        return [];
    }

    const mergedStations = [];

    route.segments.forEach((segment) => {
        const segmentLine = lines[segment.line];
        if (!segmentLine?.stations) {
            return;
        }

        const segmentStations =
            segment.reverse ? segmentLine.stations.slice().reverse() : segmentLine.stations;
        const startIndex =
            segment.startAt ?
                segmentStations.findIndex((station) => station.id === segment.startAt)
            :   0;
        const endIndex =
            segment.endAt ?
                segmentStations.findIndex((station) => station.id === segment.endAt)
            :   segmentStations.length - 1;
        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            return;
        }

        const slice = segmentStations.slice(startIndex, endIndex + 1);
        if (
            mergedStations.length > 0 &&
            mergedStations[mergedStations.length - 1]?.id === slice[0]?.id
        ) {
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

    return [];
}
