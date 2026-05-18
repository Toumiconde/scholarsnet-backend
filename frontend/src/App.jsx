import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Network from './pages/Network';
import LabStats from './pages/LabStats';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="profile/:uid" element={<Profile />} />
          <Route path="network" element={<Network />} />
          <Route path="stats/:labo" element={<LabStats />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
