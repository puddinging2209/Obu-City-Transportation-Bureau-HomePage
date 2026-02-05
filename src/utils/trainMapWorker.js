import trainMapData from '../data/trainMap.json'

const oudData = {}

function normalizeSec(sec) {
	const rest = sec % (24 * 60 * 60)
	if (3 * 60 * 60 <= rest) {
		return rest
	}
	return rest + 24 * 60 * 60
}

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
		const direction = data.firstStationIndex < data.terminalStationIndex ? 1 : -1
		if (data.firstStationIndex === -1) {
			continue
		}
		const isRunning = (normalizeSec(data._data[data.firstStationIndex].departure) <= t) && (t <= normalizeSec(data._data[data.terminalStationIndex].arrival))
		if (!isRunning) {
			continue
		}
		for (let i = data.firstStationIndex; i < data.terminalStationIndex; i += direction) {
			if (!data._data[i]) {
				continue
			}
			if (normalizeSec(data._data[i].arrival) <= t && t <= normalizeSec(data._data[i].departure)) {
				if (line.stations[i])
					result[index] = line.stations[i][1]
				break
			}
			if (normalizeSec(data._data[i].departure) < t) {
				let nextStationIndex = -1
				for (let j = i + direction; j < data.terminalStationIndex; j += direction) {
					if (!data._data[j]?.arrival) {
						continue
					}
					nextStationIndex = j
					break
				}
				if (nextStationIndex === -1) {
					break
				}
				if (t < normalizeSec(data._data[nextStationIndex].arrival)) {
					const rateBetweenStation = (t - normalizeSec(data._data[i].departure)) / (normalizeSec(data._data[nextStationIndex].arrival) - normalizeSec(data._data[i].departure))
					if (!line.stations[i] || !line.stations[nextStationIndex]) {
						break
					}
					const rateBetweenStationInLine = Math.abs(line.stations[i][1] - line.stations[nextStationIndex][1])
					const rateInLine = rateBetweenStation * rateBetweenStationInLine + Math.min(line.stations[i][1], line.stations[nextStationIndex][1])
					result[index] = rateInLine
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
				if (lineCoordinates[i + 1][2] < r) {
					continue
				}
				const rateInLine = (r - lineCoordinates[i][2]) / (lineCoordinates[i + 1][2] - lineCoordinates[i][2])
				const lat = lineCoordinates[i][0] + (lineCoordinates[i + 1][0] - lineCoordinates[i][0]) * rateInLine
				const lng = lineCoordinates[i][1] + (lineCoordinates[i + 1][1] - lineCoordinates[i][1]) * rateInLine
				result[`${id}_${n}`] = [lat, lng]
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
