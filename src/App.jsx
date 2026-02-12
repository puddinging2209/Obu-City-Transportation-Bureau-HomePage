import React from 'react';

import { createTheme } from '@mui/material';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

const Layout = React.lazy(() => import('./components/Layout.jsx'));
const About = React.lazy(() => import('./pages/About.jsx'))
const Home = React.lazy(() => import('./pages/Home.jsx'));
const Log = React.lazy(() => import('./pages/Log.jsx'));
const NewsList = React.lazy(() => import('./pages/Notice.jsx'));
const Position = React.lazy(() => import('./pages/Position.jsx'));
const RouteMap = React.lazy(() => import('./pages/RouteMap.jsx'));
const TimeTable = React.lazy(() => import('./pages/TimeTable.jsx'));
const Transfer = React.lazy(() => import('./pages/Transfer.jsx'));


import About from './pages/About.jsx';
import Home from './pages/Home.jsx';
import Log from './pages/Log.jsx';
import NewsList from './pages/Notice.jsx';
import Position from './pages/Position.jsx';
import RouteMap from './pages/RouteMap.jsx';
import TimeTable from './pages/TimeTable.jsx';
import Transfer from './pages/Transfer.jsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // 地下鉄っぽい青
    },
    secondary: {
      main: '#ff6600', // バス色
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path='/home' element={<Home />}></Route>
          <Route path='/routemap' element={<RouteMap />}></Route>
          <Route path='/transfer' element={<Transfer />}></Route>
          <Route path='/timetable' element={<TimeTable />}></Route>
          <Route path='/position' element={<Position />}></Route>
          <Route path='/log' element={<Log />}></Route>
          <Route path='/news' element={<NewsList />}></Route>
          <Route path='/about' element={<About />}></Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
