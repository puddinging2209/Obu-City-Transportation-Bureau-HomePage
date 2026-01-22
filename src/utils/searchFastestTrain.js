import { dia as readOud } from './readOud.js';
import { adjustTime } from "./Time.js";
import { terminal, typeName } from "./Train.js";

import nodes from '../data/nodes.json';

export async function searchFastestTrain(nowtime, fromsta, tosta, mode, tokkyu) {

    const nowsecond = adjustTime(nowtime)

    if (nodes[fromsta].json === nodes[tosta].json) {
        const dia = await readOud(nodes[fromsta].json);

        const innerstations = dia.railway.stations.map(sta => sta.name);

        let direction;
        let from = (innerstations.includes(fromsta)) ? innerstations.indexOf(fromsta) : innerstations.indexOf(fromsta.slice(0, 4));
        let to = (innerstations.includes(tosta)) ? innerstations.indexOf(tosta) : innerstations.indexOf(tosta.slice(0, 4));
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
            terminal: null
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
                        if (tokkyu || (!tokkyu && type != "特急" && type != "ライナー")) {
                            fastest.train = train
                            fastest.arr = arrTime
                            fastest.dep = depTime
                            fastest.type = type
                            fastest.terminal = terminal(train, dia)
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
            terminal: null
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
                        toTrain.timetable._data[to] != null &&
                        toTrain.timetable._data[to].stopType === 1
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
                                if (tokkyu || (!tokkyu && type != "特急")) {
                                    fastest.train = fromTrain
                                    fastest.arr = arrTime
                                    fastest.dep = depTime
                                    fastest.type = type
                                    fastest.terminal = terminal(toTrain, toDia)
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