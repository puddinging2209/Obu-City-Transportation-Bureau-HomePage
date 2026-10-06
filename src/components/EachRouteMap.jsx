import React from 'react';

import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtomValue } from 'jotai';

import { settingsAtom } from '../atom/atom.js';

import RouteStationRow from './RouteStationRow';

import typesData from '../data/types.json';

function EachRouteMap({ line, onClick }) {
	const theme = useTheme();
	const settings = useAtomValue(settingsAtom);

	const [types, setTypes] = React.useState([]);

	const typeColorMode =
		theme.palette.mode === 'dark' && settings.general.changeTypeColorInDarkToLight ? 'light' : theme.palette.mode;

	React.useEffect(() => {
		if (!line) {
			setTypes([]);
			return;
		}

		const { stations } = line;
		const typeSet = new Set();

		stations.forEach((station) => {
			if (!station.types) {
				return;
			}

			Object.entries(station.types).forEach(([type, value]) => {
				if (value !== null) {
					typeSet.add(type);
				}
			});
		});

		setTypes(
			Array.from(typeSet).sort(
				(a, b) => Object.values(typesData).findIndex((t) => t.code === a) - Object.values(typesData).findIndex((t) => t.code === b),
			),
		);
	}, [line]);

	if (!line) {
		return <Typography sx={{ mt: 2 }}>路線を選択してください。</Typography>;
	}
	const { isLoop, stations } = line;

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
				}}
			>
				<Stack
					alignItems='left'
					direction='row'
					sx={{
						position: 'sticky',
						top: { xs: '56px', sm: '64px' },
						zIndex: 5,
						pl: '8px',
						bgcolor: 'background.paper',
					}}
				>
					{types.map((type, i) => (
						<Box
							sx={{
								width: 30,
								py: 0.2,
								display: 'flex',
								alignItems: 'flex-end',
							}}
							key={i}
						>
							<Typography
								variant='subtitle1'
								sx={{
									writingMode: 'vertical-rl',
									fontWeight: 'bold',
									color: Object.values(typesData).find((t) => t.code === type)?.color[typeColorMode] || '#999',
								}}
							>
								{Object.values(typesData).find((t) => t.code === type)?.name || type}
							</Typography>
						</Box>
					))}
				</Stack>
				<Box sx={{ overflowX: 'auto', overflowY: 'clip' }}>
					<Box sx={{ position: 'relative', minWidth: types.length * 30 + 48 + 160 }}>
						{stations.map((station, index) => (
							<RouteStationRow
								key={station.id || index}
								line={line}
								index={index}
								stations={stations}
								lines={types}
								onClick={onClick}
							/>
						))}
						{isLoop && <RouteStationRow line={line} index={stations.length} stations={stations} lines={types} onClick={onClick} />}
					</Box>
				</Box>
			</Box>
		</Stack>
	);
}

export default EachRouteMap;
