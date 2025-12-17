import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Information from './components/Information';
import VoterRegistration from './components/VoterRegistration';
import CandidateRegistration from './components/CandidateRegistration';
import Events from './components/Events';
import api from './api';

import { Web3Provider } from './contexts/Web3Context';

function App() {
  return (
    <Web3Provider>
      <Router>
        <AppContent />
      </Router>
    </Web3Provider>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe(token).then(res => {
        if (res && res.user) setUser(res.user);
      }).catch(() => {
        localStorage.removeItem('token');
      });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to={user.role === 'candidate' ? "/candidate-registration" : "/voter-registration"} /> : <Login onLogin={handleLogin} />
        }
      />
      <Route
        path="/register"
        element={
          user ? <Navigate to={user.role === 'candidate' ? "/candidate-registration" : "/voter-registration"} /> : <Register onRegister={handleLogin} />
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/admin"
        element={
          user && user.role === 'admin' ? <Admin token={localStorage.getItem('token')} /> : <Navigate to="/dashboard" />
        }
      />
      <Route
        path="/information"
        element={
          user ? <Information user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/voter-registration"
        element={
          user ? <VoterRegistration user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/candidate-registration"
        element={
          user ? <CandidateRegistration user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/events"
        element={
          user ? <Events user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        }
      />
      <Route path="/" element={<Navigate to={user ? (user.role === 'candidate' ? "/candidate-registration" : "/voter-registration") : "/login"} />} />
    </Routes>
  );
}

export default App;
