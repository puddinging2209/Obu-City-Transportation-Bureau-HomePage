import { readFileSync, writeFileSync } from 'fs';
import { parseStringPromise } from 'xml2js';

const nameFix = {
	"健康の森公園線": "健康の森線",
	"二ツ池線　森岡支線": "二ツ池線森岡支線",
	"名港トリトンライン(南港線)": "南港線(名港トリトンライン)"
}

const kml = await parseStringPromise(readFileSync('大府市営地下鉄.kml'))

function haversineDistance(lat1, lon1, lat2, lon2) {
	const R = 6371000; // 地球の半径（メートル）
	const φ1 = lat1 * Math.PI / 180;
	const φ2 = lat2 * Math.PI / 180;
	const Δφ = (lat2 - lat1) * Math.PI / 180;
	const Δλ = (lon2 - lon1) * Math.PI / 180;

	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) *
		Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}


const result = {}

kml.kml.Document[0].Folder.find(e => e.name[0] === '線').Placemark.forEach(e => {
	const name = e.name[0].replace(/^[A-Za-z]{2}/, '')
	const actualName = nameFix[name] ?? name
	const line = e.LineString[0].coordinates[0].split('\n').filter(e => e).map(e => e.trim().split(',').toSpliced(2).toReversed().map(Number)).filter(e => e.length === 2)
	const coordinateLength = line.reduce((sum, c, i, array) => {
		if (!array[i + 1]) {
			return sum
		}
		return sum + haversineDistance(...(c.toReversed()), ...(array[i + 1]).toReversed())
	}, 0)
	let coordinateSum = 0
	const lineCoordinates = line.map((l, i) => {
		const rate = haversineDistance(...(l.toReversed()), ...(line[i - 1] ?? l).toReversed()) / coordinateLength
		coordinateSum += rate
		coordinateSum = Math.min(1, coordinateSum)
		return [...l, coordinateSum]
	})
	result[actualName] = lineCoordinates
})

writeFileSync('./../../src/data/lineShape.json', JSON.stringify(result))
