import { Stack, Typography } from '@mui/material';
import routesData from '../../../data/routes.json';
import typesData from '../../../data/types.json';
import { name } from '../../../utils/Station';

export function TrainInfo({ train }) {
	const getTime = (sec) => {
		return `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`
	}

	const route = routesData.routes[routesData.trains[train.number]]
	const length = route.flat().reduce((p, c) => p + c.length, 0)

	return (
		<Stack>
			<Stack alignItems='flex-start'>
				<Typography variant='h6'>{typesData[train.type].name} {name(train.stops.at(-1).id)}行き</Typography>
				<Typography>{train.number}</Typography>
				<Typography>{getTime(train.stops[0].dep)}発 → {getTime(train.stops.at(-1).arr)}着 {(length / 1000).toFixed(2)} km</Typography>
			</Stack>
		</Stack>
	)
}
