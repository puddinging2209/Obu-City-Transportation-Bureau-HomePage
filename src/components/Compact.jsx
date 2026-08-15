import { Button, InputBase } from '@mui/material';

export function CompactButton(props) {
	return (<Button
		{...props}
		sx={{
			minWidth: 0,
			minHeight: 24,
			px: 1,
			py: 0.25,
			fontSize: '0.75rem',
			lineHeight: 1,
			...props.sx,
		}}
	/>)
}

export function CompactInput(props) {
	return (
		<InputBase
			{...props}
			sx={{
				px: 1,
				py: 0.25,
				fontSize: '0.8rem',
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				...props.sx,
			}}
		/>
	)
}
