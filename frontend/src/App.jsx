import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ReportPage from './pages/ReportPage';
import TrendingPage from './pages/TrendingPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { authAPI } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.verify()
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Setup Socket.io connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join user room if logged in
    if (user?.id) {
      newSocket.emit('join_user', user.id);
    }

    // Listen for real-time events
    newSocket.on('new_report', (report) => {
      setAlerts(prev => [{
        id: Math.random(),
        type: 'new_report',
        message: `New scam report: ${report.type} - ${report.value}`,
        timestamp: new Date()
      }, ...prev].slice(0, 5));
    });

    newSocket.on('identifier_blacklisted', (data) => {
      setAlerts(prev => [{
        id: Math.random(),
        type: 'blacklist',
        message: `⚠️ ${data.value} has been blacklisted`,
        timestamp: new Date()
      }, ...prev].slice(0, 5));
    });

    return () => newSocket.disconnect();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation user={user} onLogout={handleLogout} />

        {/* Real-time alerts */}
        <div className="fixed top-20 right-4 max-w-sm space-y-2 z-50">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg text-white text-sm ${
                alert.type === 'new_report' ? 'bg-blue-600' : 'bg-red-600'
              } shadow-lg animate-pulse`}
            >
              {alert.message}
            </div>
          ))}
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/login" />} />
            <Route path="/report" element={user ? <ReportPage /> : <Navigate to="/login" />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <SignupPage onLogin={handleLogin} /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
