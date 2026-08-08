import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import RouteStationRow from './RouteStationRow';

import operationalRoutes from '../data/operationalRoutes.json';
import typesData from '../data/types.json';

function EachRouteMap({ line, onClick, route }) {
	if (!line) {
		return <Typography sx={{ mt: 2 }}>路線を選択してください。</Typography>;
	}

	const { name, stations } = line;
	const [types, setTypes] = React.useState([]);

	React.useEffect(() => {
		if (operationalRoutes[route.id]?.types) {
			setTypes(
				Object.entries(operationalRoutes[route.id].types)
					.filter(([_, v]) => v)
					.map(([k, _]) => k),
			);
			return;
		}

		const typeCounter = {};
		stations.forEach((station) => {
			Object.entries(station.types).forEach(([type, value]) => {
				if (value !== null) {
					typeCounter[type] = typeCounter[type] ? typeCounter[type] + 1 : 1;
				}
			});
		});

		const availableTypes = Object.keys(typeCounter).filter((type) => typeCounter[type] > 1);
		const orderedTypes = Object.values(typesData)
			.map((t) => t.code)
			.filter((code) => availableTypes.includes(code));
		const filteredTypes = route?.types?.length ? orderedTypes.filter((code) => route.types.includes(code)) : orderedTypes;

		setTypes(filteredTypes);
	}, [route, stations]);

	return (
		<Stack
			alignItems='center'
			sx={{
				mt: 2,
				px: 1,
				width: '100%',
			}}
		>
			<Box
				sx={{
					position: 'relative',
					width: { xs: '100%', md: '70vw' },
					mx: 'auto',
					borderRadius: 2,
					bgcolor: 'background.paper',
					overflowX: 'auto',
				}}
			>
				<Stack
					alignItems='left'
					direction='row'
					sx={{
						position: 'relative',
						pl: '8px',
					}}
				>
					{types.map((type) => (
						<Box
							key={type}
							sx={{
								width: 30,
								py: 0.2,
								display: 'flex',
								alignItems: 'flex-end',
							}}
						>
							<Typography
								variant='subtitle1'
								sx={{
									writingMode: 'vertical-rl',
									fontWeight: 'bold',
									color: Object.values(typesData).find((t) => t.code === type)?.color || '#999',
								}}
							>
								{Object.values(typesData).find((t) => t.code === type)?.name || type}
							</Typography>
						</Box>
					))}
				</Stack>
				<Box sx={{ position: 'relative', zIndex: 2, minWidth: types.length * 30 + 48 + 160 }} fullWidth>
					{stations.map((station, index) => (
						<RouteStationRow
							key={`${station.name}${index}`}
							line={line}
							i={index}
							stations={stations}
							lines={types}
							onClick={onClick}
							selectedRouteId={route.id}
						/>
					))}
				</Box>
			</Box>
		</Stack>
	);
}

export default EachRouteMap;
