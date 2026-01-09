import stations from '../../../public/data/stations.json';

export default function searchNearestStation() {
    return new Promise((resolve, reject) => {

        function hubeny(lat1, lng1, lat2, lng2) {
            const rad = deg => deg * Math.PI / 180;

            lat1 = rad(lat1);
            lng1 = rad(lng1);
            lat2 = rad(lat2);
            lng2 = rad(lng2);

            const latDiff = lat1 - lat2;
            const lngDiff = lng1 - lng2;
            const latAvg = (lat1 + lat2) / 2.0;

            const a = 6378137.0;
            const e2 = 0.00669438002301188;
            const a1e2 = 6335439.32708317;

            const sinLat = Math.sin(latAvg);
            const W2 = 1.0 - e2 * sinLat * sinLat;

            const M = a1e2 / (Math.sqrt(W2) * W2);
            const N = a / Math.sqrt(W2);

            const t1 = M * latDiff;
            const t2 = N * Math.cos(latAvg) * lngDiff;

            return Math.sqrt(t1 * t1 + t2 * t2);
        }

        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                const nearest = Object.values(stations)
                    .map(s => ({
                        name: s.name,
                        d: hubeny(lat, lng, s.lat, s.lng)
                    }))
                    .sort((a, b) => a.d - b.d)[0];

                resolve(nearest.name);
            },
            err => {
                reject(err);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}
