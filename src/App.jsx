import React from 'react';

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

const Layout = React.lazy(() => import('./components/Layout.jsx'));
const About = React.lazy(() => import('./pages/About.jsx'));
const Home = React.lazy(() => import('./pages/Home.jsx'));
const Log = React.lazy(() => import('./pages/Log.jsx'));
const NewsList = React.lazy(() => import('./pages/Notice.jsx'));
const Position = React.lazy(() => import('./pages/Position.jsx'));
const RouteMap = React.lazy(() => import('./pages/RouteMap.jsx'));
const TimeTable = React.lazy(() => import('./pages/TimeTable.jsx'));
const Transfer = React.lazy(() => import('./pages/Transfer.jsx'));

function App() {
    return (
        <div style={{ paddingBottom: { xs: '50px', md: '0px' } }}>
            <HashRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path='/' element={<Navigate to='/home' replace />} />
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
        </div>
    );
}

export default App;
