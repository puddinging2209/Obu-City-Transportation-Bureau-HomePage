import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import TrainOutlinedIcon from '@mui/icons-material/TrainOutlined';
import { Alert, AlertTitle, Box, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const destinations = [
	{
		label: '路線図',
		description: '駅や路線のつながりを見る',
		to: '/routemap',
		Icon: MapOutlinedIcon,
	},
	{
		label: '時刻表',
		description: '駅ごとの列車時刻を調べる',
		to: '/timetable',
		Icon: ScheduleOutlinedIcon,
	},
	{
		label: '乗換案内',
		description: '駅から駅への行き方を探す',
		to: '/transfer',
		Icon: AltRouteOutlinedIcon,
	},
	{
		label: '列車位置',
		description: '列車の現在位置を確認する',
		to: '/position',
		Icon: TrainOutlinedIcon,
	},
];

function About() {
	return (
		<Container maxWidth='md' sx={{ py: { xs: 3, sm: 5 }, textAlign: 'left' }}>
			<Stack spacing={{ xs: 3, sm: 4 }}>
				<Box
					sx={{
						position: 'relative',
						overflow: 'hidden',
						p: { xs: 3, sm: 5 },
						borderRadius: 2,
						bgcolor: 'primary.main',
						color: 'primary.contrastText',
					}}
				>
					<Box
						sx={{
							position: 'absolute',
							right: { xs: -24, sm: 24 },
							bottom: { xs: -34, sm: -48 },
							width: { xs: 130, sm: 190 },
							height: { xs: 130, sm: 190 },
							border: '1px solid',
							borderColor: 'primary.contrastText',
							borderRadius: '50%',
							opacity: 0.18,
							'&::before, &::after': {
								content: '""',
								position: 'absolute',
								inset: 14,
								border: '1px solid',
								borderColor: 'inherit',
								borderRadius: '50%',
							},
							'&::after': { inset: 30 },
						}}
					/>
					<Stack spacing={1.5} sx={{ position: 'relative', maxWidth: 620 }}>
						<Typography variant='overline' sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
							OBU CITY SUBWAY / ABOUT
						</Typography>
						<Typography variant='h4' component='h1' sx={{ fontWeight: 700 }}>
							大府市営地下鉄とは
						</Typography>
						<Typography variant='body1' sx={{ opacity: 0.9, maxWidth: 540 }}>
							大府のまちを走る、想像の地下鉄。その路線や駅、列車の世界をご案内します。
						</Typography>
					</Stack>
				</Box>

				<Box>
					<Stack spacing={1.5}>
						<Typography variant='h6' component='h2' sx={{ fontWeight: 700 }}>
							架空の地下鉄
						</Typography>
						<Typography color='text.secondary' sx={{ lineHeight: 1.9 }}>
							大府市営地下鉄は、大府市とその周辺を舞台に趣味で制作している架空の鉄道です。この架空の世界では、大府市民の皆さまの血税によって運営され、毎日の移動を支える市営地下鉄という設定です。路線図や時刻表、列車位置などを通して、その世界をお楽しみください。
						</Typography>
					</Stack>
				</Box>

				<Divider />

				<Box component='nav' aria-label='大府市営地下鉄のコンテンツ'>
					<Stack spacing={2}>
						<Box>
							<Typography variant='h6' component='h2' sx={{ fontWeight: 700 }}>
								はじめての方へ
							</Typography>
							<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
								まずは路線図で駅を眺めて、気になる駅や行き先を探してみましょう。
							</Typography>
						</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
							{destinations.map(({ label, description, to, Icon }) => (
								<Paper
									key={to}
									component={RouterLink}
									to={to}
									variant='outlined'
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1.5,
										p: 2,
										color: 'inherit',
										textDecoration: 'none',
										borderRadius: 1,
										transition: 'border-color 160ms ease, background-color 160ms ease',
										'&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
										'&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
									}}
								>
									<Box
										sx={{
											display: 'grid',
											placeItems: 'center',
											width: 40,
											height: 40,
											flexShrink: 0,
											borderRadius: 1,
											bgcolor: 'action.hover',
											color: 'primary.main',
										}}
									>
										<Icon fontSize='small' />
									</Box>
									<Box sx={{ minWidth: 0, flexGrow: 1 }}>
										<Typography sx={{ fontWeight: 700 }}>{label}</Typography>
										<Typography variant='body2' color='text.secondary'>
											{description}
										</Typography>
									</Box>
									<ArrowForwardIcon fontSize='small' color='action' />
								</Paper>
							))}
						</Box>
					</Stack>
				</Box>

				<Alert severity='info' variant='outlined' sx={{ borderRadius: 1 }}>
					<AlertTitle sx={{ fontWeight: 700 }}>このウェブサイトについて</AlertTitle>
					このウェブサイトは大府市公式のものではありません。大府市交通局・大府市営地下鉄や掲載情報はすべて架空の設定であり、実在の大府市やその他企業、団体とは一切関係ありません。
				</Alert>
			</Stack>
		</Container>
	);
}

export default About;
