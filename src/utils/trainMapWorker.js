import { name } from './Station.js'
import { terminal, typeName } from './Train.js'

import trainMapData from '../data/trainMap.json'

const oudData = {}

function normalizeSec(sec) {
    const rest = sec % (24 * 60 * 60)
    if (3 * 60 * 60 <= rest) {
        return rest
    }
    return rest + 24 * 60 * 60
}

/** 路線全体に対する列車の位置を割合で返す
 * @param {string} id OUDの路線ID
 * @param {number} sec 秒
 * @returns {Object<number, number>} 列車のインデックスをキー、路線全体に対する位置の割合を値とした配列風オブジェクト 
*/
function calcTrainsRate(id, sec) {
    const t = normalizeSec(sec)
    const oud = oudData[id]
    if (!oud) {
        return {}
    }
    const line = Object.values(trainMapData).find(e => e.json === id)
    const trains = oud.railway.diagrams[0].trains[0]
    const result = {}
    for (let index = 0; index < trains.length; index++) {
        const train = trains[index]
        const data = train.timetable
        const direction = train.direction === 0 ? (
            line.stations.indexOf(sta => sta[0] == name(oud.railway.stations[data.firstStationIndex].name)) < line.stations.indexOf(sta => sta[0] == name(oud.railway.stations[data.terminalStationIndex].name)) ? 1 : -1
        ) : (
            line.stations.indexOf(sta => sta[0] == name(oud.railway.stations[oud.raialway.stations.length - 1 - data.firstStationIndex].name)) < line.stations.indexOf(sta => sta[0] == name(oud.railway.stations[oud.raialway.stations.length - 1 - data.terminalStationIndex].name)) ? -1 : 1
        )
        if (data.firstStationIndex === -1) {
            continue
        }
        const isRunning = (normalizeSec(data._data[data.firstStationIndex].departure) <= t) && (t <= normalizeSec(data._data[data.terminalStationIndex].arrival ?? data._data[data.terminalStationIndex].departure))
        if (!isRunning) {
            continue
        }
        for (let i = data.firstStationIndex; i < data.terminalStationIndex; i++) {
            if (!data._data[i]) {
                continue
            }
            if (normalizeSec(data._data[i].arrival) <= t && t <= normalizeSec(data._data[i].departure)) {
                if (line.stations[direction === 1 ? i : line.stations.length - 1 - i]) {
                    const rate = line.stations[direction === 1 ? i : line.stations.length - 1 - i][1];
                    result[index] = { text: `${rate} ${train.number} ${typeName(train, oud)} ${terminal(train, oud)}`, train: train, rate: rate }
                }
                break
            }
            if (normalizeSec(data._data[i].departure) < t) {
                let nextStationIndex = -1
                for (let j = i + 1; j <= data.terminalStationIndex; j++) {
                    if (!data._data[j]?.arrival && !data._data[j]?.departure) {
                        continue
                    }
                    nextStationIndex = j
                    break
                }
                if (nextStationIndex === -1) {
                    break
                }
                if (t < normalizeSec(data._data[nextStationIndex].arrival ?? data._data[nextStationIndex].departure)) {
                    const rateBetweenStation = (t - normalizeSec(data._data[i].departure)) / (normalizeSec(data._data[nextStationIndex].arrival ?? data._data[nextStationIndex].departure) - normalizeSec(data._data[i].departure))
                    if (!line.stations[direction === 1 ? i : line.stations.length - 1 - i] || !line.stations[direction === 1 ? nextStationIndex : line.stations.length - 1 - nextStationIndex]) {
                        break
                    }
                    const rateBetweenStationInLine =
                        Math.abs(
                            line.stations[direction === 1 ? i : line.stations.length - 1 - i][1] - line.stations[direction === 1 ? nextStationIndex : line.stations.length - 1 - nextStationIndex][1]
                        )
                    const rateInLine = (direction === 1 ? rateBetweenStation : 1 - rateBetweenStation) * rateBetweenStationInLine + Math.min(line.stations[direction === 1 ? i : line.stations.length - 1 - i][1], line.stations[direction === 1 ? nextStationIndex : line.stations.length - 1 - nextStationIndex][1])
                    result[index] = { text: `${data._data[data.terminalStationIndex].arrival} ${train.number} ${typeName(train, oud)} ${terminal(train, oud)}`, train: train, rate: rateInLine }
                    break
                }
            }
        }
    }
    return result
}

function calcPositions(sec) {
    const result = {}
    Object.keys(oudData).forEach(id => {
        const trainsRate = calcTrainsRate(id, sec)
        const lineCoordinates = Object.values(trainMapData).find(e => e.json === id).line_coordinates

        Object.entries(trainsRate).forEach(([n, r]) => {
            for (let i = 0; i < lineCoordinates.length - 1; i++) {
                if (lineCoordinates[i + 1][2] < r.rate) {
                    continue
                }
                const rateInLine = (r.rate - lineCoordinates[i][2]) / (lineCoordinates[i + 1][2] - lineCoordinates[i][2])
                const lat = lineCoordinates[i][0] + (lineCoordinates[i + 1][0] - lineCoordinates[i][0]) * rateInLine
                const lng = lineCoordinates[i][1] + (lineCoordinates[i + 1][1] - lineCoordinates[i][1]) * rateInLine
                result[`${id}_${n}`] = { text: r.text, train: r.train, pos: [lat, lng] }
                break
            }
        })
    })
    return result
}

self.addEventListener('message', ({ data }) => {
    switch (data.type) {
        case 'setOud': {
            oudData[data.id] = data.oud
            break
        }
        case 'calcPosition': {
            console.log(data.sec)
            self.postMessage({
                type: 'calcPositionResult',
                data: calcPositions(data.sec)
            })
        }

        default:
            break
    }
})
