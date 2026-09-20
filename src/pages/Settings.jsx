import React from 'react';

import { Box, Card, CardContent, Checkbox, MenuItem, Select, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { parseAsInteger, useQueryState } from 'nuqs';
import { settingsAtom } from '../atom/atom.js';
import { getTitle } from '../utils/getTitles.js';

function Settings() {
	const [settings, setSettings] = useAtom(settingsAtom);

	const [tabValue, setTabValue] = useQueryState('tab', parseAsInteger.withDefault(0));
	const [title, setTitle] = React.useState(window.localStorage.getItem('title') ?? '');
	const titleIds = JSON.parse(window.localStorage.getItem('titles') ?? '[]');

	const theme = useTheme();

	const TabPanel = (props) => {
		const { children, value, index, ...other } = props;

		return (
			<div role='tabpanel' hidden={value !== index} {...other}>
				{value === index && children}
			</div>
		);
	};

	const handleTabChange = (_, newValue) => {
		setTabValue(newValue);
	};

	const handleThemeChange = (_, newTheme) => {
		if (newTheme !== null) {
			setSettings({ ...settings, general: { ...settings.general, theme: newTheme } });
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
					<Tab label='地図' />
					<Tab label='称号' />
				</Tabs>
			</Box>

			<TabPanel value={tabValue} index={0}>
				<Card sx={{ borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px` }}>
					<CardContent>
						<Stack direction='row' justifyContent='space-between' alignItems='center'>
							テーマ
							<ToggleButtonGroup size='small' value={settings.general.theme} onChange={handleThemeChange} exclusive>
								<ToggleButton value='light'>ライトモード</ToggleButton>
								<ToggleButton value='dark'>ダークモード</ToggleButton>
								<ToggleButton value='system'>システム設定に従う</ToggleButton>
							</ToggleButtonGroup>
						</Stack>
						<Stack direction='row' justifyContent='space-between' alignItems='center'>
							時刻に秒を表示する
							<Checkbox
								checked={settings.general.showSeconds}
								onChange={(e) => setSettings({ ...settings, general: { ...settings.general, showSeconds: e.target.checked } })}
							/>
						</Stack>
					</CardContent>
				</Card>
			</TabPanel>
			<TabPanel value={tabValue} index={1}>
				<Card sx={{ borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px` }}>
					<CardContent>
						<Stack direction='row' justifyContent='space-between' alignItems='center'>
							位置更新頻度
							<ToggleButtonGroup
								size='small'
								value={String(settings.map.updateInterval)}
								onChange={(e, v) => setSettings({ ...settings, map: { ...settings.map, updateInterval: Number(v) } })}
								exclusive
							>
								<ToggleButton value='0'>デフォルト</ToggleButton>
								<ToggleButton value='50'>50ms</ToggleButton>
								<ToggleButton value='100'>100ms</ToggleButton>
							</ToggleButtonGroup>
						</Stack>
					</CardContent>
				</Card>
			</TabPanel>
			<TabPanel value={tabValue} index={2}>
				<Card sx={{ borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px` }}>
					<CardContent>
						{titleIds.length > 0 ?
							<Stack direction='row' justifyContent='space-between' alignItems='center'>
								称号の変更
								<Select
									value={title}
									onChange={(e) => {
										setTitle(e.target.value);
										window.localStorage.setItem('title', e.target.value);
									}}
									size='small'
								>
									{titleIds.map((title) => (
										<MenuItem value={title} key={title}>
											{getTitle(title)}
										</MenuItem>
									))}
								</Select>
							</Stack>
						:	<Typography>称号がまだありません</Typography>}
					</CardContent>
				</Card>
			</TabPanel>
		</Box>
	);
}

export default Settings;
