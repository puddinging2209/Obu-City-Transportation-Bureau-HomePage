import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrainIcon from '@mui/icons-material/Train';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';

export default function MobileBottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const value = React.useMemo(() => {
    if (location.pathname.startsWith('/home')) return 'home';
    if (location.pathname.startsWith('/timetable')) return 'time-table';
    if (location.pathname.startsWith('/routemap')) return 'route-map';
    if (location.pathname.startsWith('/transfer')) return 'transfer';
    if (location.pathname.startsWith('/position')) return 'position';
    return 'home';
  }, [location.pathname]);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', md: 'none' },
        zIndex: theme => theme.zIndex.appBar
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_, newValue) => {
          switch (newValue) {
            case 'home':
              navigate('/home');
              break;
            case 'route-map':
              navigate('/routemap');
              break;
            case 'transfer':
              navigate('/transfer');
              break;
            case 'time-table':
              navigate('/timetable');
              break;
            case 'position':
              navigate('/position');
              break;
            default:
              navigate('/')  
              break;
          }
        }}
        showLabels
      >
        <BottomNavigationAction
          label="ホーム"
          value="home"
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          label="路線図"
          value="route-map"
          icon={<MapIcon />}
        />
        <BottomNavigationAction
          label="乗換案内"
          value="transfer"
          icon={<SwapHorizIcon />}
        />
        <BottomNavigationAction
          label="時刻表"
          value="time-table"
          icon={<ScheduleIcon />}
        />
        <BottomNavigationAction
          label="列車位置"
          value="position"
          icon={<TrainIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}
