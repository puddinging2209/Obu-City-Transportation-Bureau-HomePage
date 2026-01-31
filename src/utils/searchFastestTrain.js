import { dia as readOud } from './readOud.js';
import { adjustTime } from "./Time.js";
import { terminal, typeName } from "./Train.js";

import nodes from '../data/nodes.json';

/**
 * 特定の駅間の最速の列車を探す
 * @param {Number} nowtime 出発時刻（mode=0）または到着時刻（mode=1）
 * @param {String} fromsta 出発駅（ナンバリング）
 * @param {String} tosta 到着駅（ナンバリング）
 * @param {Number} mode 出発時刻から検索(0) or 到着時刻から検索(1)
 * @param {Boolean} tokkyu 有料列車（特急 or ライナー）を許可するかどうか
 * @param {Array<String>} visited 既に経由した駅リスト（ナンバリング）
 * @returns {{train: String, arr: Number, dep: Number, type: String, terminal: String, passing: Array<String>}} 最速の列車情報 {train, arr, dep, type, terminal}
 */
export async function searchFastestTrain(nowtime, fromsta, tosta, mode, tokkyu, visited) {

    const nowsecond = adjustTime(nowtime)

    if (nodes[fromsta].json === nodes[tosta].json) {
        const dia = await readOud(nodes[fromsta].json);

        const innerstations = dia.railway.stations.map(sta => sta.name);

        let direction;
        let from = (innerstations.includes(fromsta)) ? innerstations.indexOf(fromsta) : innerstations.indexOf(fromsta.slice(0, 4));
        let to = (innerstations.includes(tosta)) ? innerstations.indexOf(tosta) : innerstations.indexOf(tosta.slice(0, 4));
        if (fromsta === 'ON10a') console.log(`fromsta ON10a${from}`);
        if (from < to) {
            direction = 0;
        } else {
            direction = 1;
            from = innerstations.length - 1 - from;
            to = innerstations.length - 1 - to;
        }

        let fastest = {
            train: null,
            arr: null,
            dep: null,
            type: null,
            terminal: null,
            passing: [],
        };
        for (let day = 0; -2 < day && day < 2; true) {
            dia.railway.diagrams[0].trains[direction].forEach((train) => {
                if (
                    train.timetable._data[from]?.stopType === 1 && train.timetable._data[to]?.stopType === 1
                ) {
                    const arrTime = adjustTime(train.timetable._data[to].arrival ?? train.timetable._data[to].departure) + day * 86400
                    const depTime = adjustTime(train.timetable._data[from].departure ?? train.timetable._data[from].arrival) + day * 86400
                    const type = typeName(train, dia)

                    if (
                        (
                            mode == 0 && nowsecond < depTime &&
                            (fastest.train === null || fastest.arr > arrTime)
                        ) ||
                        (
                            mode == 1 && nowsecond > arrTime &&
                            (fastest.train === null || fastest.dep < depTime)
                        )
                    ) {
                        const passing = []
                        train.timetable._data.forEach((sta, i) => {
                            if (!sta) return
                            if (!(from < i && i < to)) return

                            const station =
                                train.direction === 0
                                    ? innerstations[i]
                                    : innerstations[innerstations.length - 1 - i]

                            passing.push(station)
                        })
                        if ((tokkyu || (!tokkyu && type != "特急" && type != "ライナー")) && !visited.some(s => passing.includes(s))) {
                            fastest.train = train
                            fastest.arr = arrTime
                            fastest.dep = depTime
                            fastest.type = type
                            fastest.terminal = terminal(train, dia)
                            fastest.passing = passing
                        }
                    }
                }
            })
            if (fastest.train) break;

            if (mode == 0) {
                day++
            } else {
                day--
            }
        }

        if (fromsta === 'ON10a') console.log(fastest);
        return fastest;

    } else {

        const fromDia = await readOud(nodes[fromsta].json);
        const toDia = await readOud(nodes[tosta].json);

        const fromStations = fromDia.railway.stations.map(sta => sta.name);
        const toStations = toDia.railway.stations.map(sta => sta.name);

        let f = (fromStations.includes(fromsta)) ? fromStations.indexOf(fromsta) : fromStations.indexOf(fromsta.slice(0, 4));
        let t = (toStations.includes(tosta)) ? toStations.indexOf(tosta) : toStations.indexOf(tosta.slice(0, 4));

        let fastest = {
            train: null,
            arr: null,
            dep: null,
            type: null,
            terminal: null,
            passing: [],
        };
        for (let day = 0; -2 < day && day < 2; true) {
            fromDia.railway.diagrams[0].trains.flat().forEach((fromTrain) => {
                const from = fromTrain.direction === 0 ? f : fromStations.length - 1 - f;
                if (
                    fromTrain.timetable._data[from] != null &&
                    fromTrain.number != '' &&
                    toDia.railway.diagrams[0].trains.flat().some(d => d.number == fromTrain.number)
                ) {
                    const toTrain = toDia.railway.diagrams[0].trains.flat().find(d => d.number == fromTrain.number)
                    const to = toTrain.direction === 0 ? t : toStations.length - 1 - t;
                    if (
                        fromTrain.timetable._data[from].stopType === 1 &&
                        toTrain.timetable._data[to]?.stopType === 1
                    ) {
                        const arrTime = adjustTime(toTrain.timetable._data[to].arrival ?? toTrain.timetable._data[to].departure) + day * 86400
                        const depTime = adjustTime(fromTrain.timetable._data[from].departure ?? fromTrain.timetable._data[from].arrival) + day * 86400
                        const type = typeName(fromTrain, fromDia)
                        if (depTime < arrTime) {

                            if (
                                (mode == 0 && nowsecond < depTime &&
                                    (fastest.train === null || fastest.time > arrTime)) ||

                                (mode == 1 && nowsecond > arrTime &&
                                    (fastest.train === null || fastest.dep < depTime))
                            ) {
                                const passing = []
                                fromTrain.timetable._data.forEach((sta, i) => {
                                    if (!sta) return
                                    if (!(from < i)) return

                                    const station =
                                        fromTrain.direction === 0
                                            ? fromStations[i]
                                            : fromStations[fromStations.length - 1 - i]

                                    passing.push(station)
                                })
                                toTrain.timetable._data.forEach((sta, i) => {
                                    if (!sta) return
                                    if (!(i < to)) return

                                    const station =
                                        toTrain.direction === 0
                                            ? toStations[i]
                                            : toStations[toStations.length - 1 - i]

                                    passing.push(station)
                                })
                                if (tokkyu || (!tokkyu && type != "特急" && type != "ライナー")) {
                                    fastest.train = fromTrain
                                    fastest.arr = arrTime
                                    fastest.dep = depTime
                                    fastest.type = type
                                    fastest.terminal = terminal(toTrain, toDia)
                                    fastest.passing = passing
                                }
                            }
                        }
                    }
                }
            })
            if (fastest.train) break;

            if (mode == 0) {
                day++
            } else {
                day--
            }
        }

        return fastest;

    }
}