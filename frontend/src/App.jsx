import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Network from './pages/Network';
import LabStats from './pages/LabStats';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Landing from './pages/Landing';
import PublicationDetail from './pages/PublicationDetail';
import Archive from './pages/Archive';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './lib/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="profile/:uid" element={<Profile />} />
            <Route path="publication/:pid" element={<PublicationDetail />} />
            <Route path="network" element={<Network />} />
            <Route path="stats/:labo" element={<LabStats />} />
            <Route path="admin" element={<Admin />} />
            <Route path="archive" element={<Archive />} />
            <Route path="login" element={<Login />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
