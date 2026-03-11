import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Visitors from './components/Visitors';
import Appointments from './components/Appointments';
import Passes from './components/Passes';
import CheckInOut from './components/CheckInOut';
import Reports from './components/Reports';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <Auth onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/visitors" element={
          user ? <Visitors /> : <Navigate to="/login" />
        } />
        <Route path="/appointments" element={
          user ? <Appointments user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/passes" element={
          user ? <Passes user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/checkinout" element={
          user ? <CheckInOut user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/reports" element={
          user ? <Reports user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
