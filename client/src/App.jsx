import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MonitoringPage from './pages/MonitoringPage';
import RiwayatPage from './pages/RiwayatPage';
import LatencyPage from './pages/LatencyPage';
import LaporanPage from './pages/LaporanPage';
import ServersPage from './pages/ServersPage';
import UsersPage from './pages/UsersPage';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/auth/me').then(res => setUser(res.data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-surface-container-high border-t-primary"></div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={setUser} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={() => { axios.get('/api/auth/logout'); setUser(null); }} /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="riwayat" element={<RiwayatPage />} />
          <Route path="latency" element={<LatencyPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          {user?.role === 'admin' && <Route path="servers" element={<ServersPage />} />}
          {user?.role === 'admin' && <Route path="users" element={<UsersPage />} />}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
