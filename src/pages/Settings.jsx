import React from 'react';

import { Box, Card, CardContent, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { settingsAtom } from '../utils/Atom.js';

function Settings() {
	const [settings, setSettings] = useAtom(settingsAtom);
	const [tabValue, setTabValue] = React.useState(0);

	const theme = useTheme();

	const TabPanel = (props) => {
		const { children, value, index, ...other } = props;

		return (
			<div role='tabpanel' hidden={value !== index} {...other}>
				{value === index && <Typography>{children}</Typography>}
			</div>
		);
	};

	const handleTabChange = (event, newValue) => {
		setTabValue(newValue);
	};

	const handleThemeChange = (event, newTheme) => {
		if (newTheme !== null) {
			setSettings({ ...settings, theme: newTheme });
		}
	};

	return (
		<Box sx={{ width: '100%', bgcolor: 'background.paper', p: 3 }}>
			<Typography variant='h4' gutterBottom>
				設定
			</Typography>

			<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
				<Tabs value={tabValue} onChange={handleTabChange}>
					<Tab label='一般' />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<Card sx={{ borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px` }}>
					<CardContent>
						<Stack direction='row' justifyContent='space-between' alignItems='center'>
							テーマ
							<ToggleButtonGroup size='small' value={settings.theme} onChange={handleThemeChange} exclusive>
								<ToggleButton value='light'>ライトモード</ToggleButton>
								<ToggleButton value='dark'>ダークモード</ToggleButton>
								<ToggleButton value='system'>システム設定に従う</ToggleButton>
							</ToggleButtonGroup>
						</Stack>
					</CardContent>
				</Card>
			</TabPanel>
		</Box>
	);
}

export default Settings;
