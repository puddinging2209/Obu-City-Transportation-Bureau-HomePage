import { dia as readOud } from './readOud.js'
import { adjustTime } from "./Time.js"
import { terminal, typeName } from "./Train.js"

export async function searchFastestTrain(rosen, nowtime, fromsta, tosta, mode, tokkyu) {
    const dia = await readOud(rosen)
    const innerstations = dia.railway.stations.map(sta => sta["name"])

    const nowsecond = adjustTime(nowtime)

    let direction;
    let from = innerstations.indexOf(fromsta);
    let to = innerstations.indexOf(tosta);
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
                train.timetable.firstStationIndex <= from &&
                to <= train.timetable.terminalStationIndex &&
                train.timetable._data[from] != null &&
                train.timetable._data[to] != null
            ) {
                if (
                    train.timetable._data[from].stopType === 1 && train.timetable._data[to].stopType === 1
                ) {
                    const arrTime = adjustTime(train.timetable._data[to].arrival ?? train.timetable._data[to].departure) + day * 86400
                    const depTime = adjustTime(train.timetable._data[from].departure ?? train.timetable._data[from].arrival) + day * 86400
                    const type = typeName(train, dia)

                    if (
                        (mode == 0 && nowsecond < depTime &&
                            (fastest.train === null || fastest.time > arrTime)) ||

                        (mode == 1 && nowsecond > arrTime &&
                            (fastest.train === null || fastest.dep < depTime))
                    ) {
                        if (tokkyu || (!tokkyu && type != "特急")) {
                            fastest.train = train
                            fastest.arr = arrTime
                            fastest.dep = depTime
                            fastest.type = type
                            fastest.terminal = terminal(train, dia)
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

    return fastest
}