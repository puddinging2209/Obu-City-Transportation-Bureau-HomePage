import TrainIcon from '@mui/icons-material/Train';
import { Alert, Box, Fab, Snackbar, Stack, Typography } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import React from 'react';
import searchNearestStation from '../../../utils/searchNearestStation';
import { name } from '../../../utils/Station';
import { geolocationAtom } from '../states/geolocation';
import { addToStationLogAtom, stationLogAtom } from '../states/log';

export function LoginButton() {
	const geolocation = useAtomValue(geolocationAtom)
	const stationLog = useAtomValue(stationLogAtom)
	const addToStationLog = useSetAtom(addToStationLogAtom)
	const [loginInfo, setLoginInfo] = React.useState(null)
	const [isOpen, setIsOpen] = React.useState(false)

	const loginHandle = () => {
		const id = searchNearestStation({ lat: geolocation[0], lng: geolocation[1] })
		const isNew = !(new Set(stationLog.map(s => s.id)).has(id))
		const isDuplicated = !addToStationLog(id)
		setLoginInfo({ id, isDuplicated, isNew })
		setIsOpen(true)
	}

	return (
		<>
			<Box
				sx={{
					position: 'absolute',
					right: '0px',
					bottom: '0px',
					padding: '16px',
					translate: geolocation ? '0% 0%' : '0% 100%',
					transition: 'translate .1s'
				}}
			>
				<Fab
					sx={{
						width: '80px',
						height: '80px'
					}}
					onClick={loginHandle}
				>
					<Stack alignItems='center'>
						<TrainIcon fontSize='large'></TrainIcon>
						<Typography fontWeight='bold' sx={{ textTransform: 'none' }}>log in</Typography>
					</Stack>
				</Fab>
			</Box>
			<Snackbar
				sx={{ anchorOrigin: { vertical: { xs: 'top', md: 'bottom' }, horizontal: 'center' } }}
				open={isOpen}
				onClose={() => setIsOpen(false)}
				autoHideDuration={5000}
			>
				<Alert onClose={() => setIsOpen(false)} severity='success' variant='filled' sx={{ width: '100%' }}>
					{name(loginInfo?.id)}駅 に訪問しました {loginInfo?.isDuplicated ? '(重複)' : ''}{loginInfo?.isNew ? '(新駅)' : ''}
				</Alert>
			</Snackbar>
		</>
	)
}
