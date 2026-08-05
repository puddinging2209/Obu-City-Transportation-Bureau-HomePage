import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { bottomSheetContent, clearBottomSheetAtom, isBottomSheetOpenAtom, setBottomSheetComponentAtom, setBottomSheetTitleAtom } from '../states/sheet';

export function BottomSheet() {
	const theme = useTheme()
	const bottomSheet = useAtomValue(bottomSheetContent)
	const isBottomSheetOpen = useAtomValue(isBottomSheetOpenAtom)
	const setBottomSheetContent = useSetAtom(setBottomSheetComponentAtom)
	const setBottomSheetTitle = useSetAtom(setBottomSheetTitleAtom)
	const clearBottomSheet = useSetAtom(clearBottomSheetAtom)
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

	return (
		<Stack
			sx={{
				position: 'absolute',
				width: isMobile ? 'calc(100% - 16px)' : '350px',
				maxHeight: '400px',
				padding: '16px',
				left: '8px',
				bottom: '0px',
				borderRadius: '12px 12px 0px 0px',
				bgcolor: theme.palette.background.default,
				zIndex: 1051,
				translate: isBottomSheetOpen ? '0% 0%' : '0% 100%',
			}}
			spacing={1}
		>
			<Stack
				direction='row'
				justifyContent='space-between'
				alignItems='center'
				sx={{
					height: '100%',
				}}
			>
				<Typography>{bottomSheet.title}</Typography>
				<IconButton size='small' onClick={clearBottomSheet}>
					<CloseIcon></CloseIcon>
				</IconButton>
			</Stack>
			<Box
				sx={{
					height: '100%',
					overflowY: 'auto'
				}}
			>
				{isBottomSheetOpen ? (
					<bottomSheet.component {...bottomSheet.props}></bottomSheet.component>
				) : <></>}
			</Box>
		</Stack>
	)
}
