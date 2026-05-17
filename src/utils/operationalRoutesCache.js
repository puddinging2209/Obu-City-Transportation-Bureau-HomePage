import operationalRoutes from '../data/operationalRoutes.json';
import buildRouteStations from './buildOperationalRoute.js';

function hashObject(obj) {
    const str = JSON.stringify(obj);
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
        hash = hash & 0xffffffff;
    }
    return hash >>> 0;
}

let cacheVersion = null;
let cacheMap = {};

function buildCache() {
    const version = hashObject(operationalRoutes);
    if (cacheVersion === version && Object.keys(cacheMap).length > 0) {
        return cacheMap;
    }

    const map = {};
    Object.entries(operationalRoutes).forEach(([routeId, routeObj]) => {
        try {
            map[routeId] = buildRouteStations(routeObj) || [];
        } catch (e) {
            map[routeId] = [];
        }
    });

    cacheVersion = version;
    cacheMap = map;
    return cacheMap;
}

export function getOperationalStationsMap() {
    return buildCache();
}

export function getOperationalStations(routeId) {
    const map = buildCache();
    return map[routeId] || [];
}

export function clearOperationalCache() {
    cacheVersion = null;
    cacheMap = {};
}

export default {
    getOperationalStationsMap,
    getOperationalStations,
    clearOperationalCache,
};
