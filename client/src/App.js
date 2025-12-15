import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Candidates from './components/Candidates';
import Admin from './components/Admin';
import api from './api';

function App() {
  const [view, setView] = useState('candidates');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe(token).then(res => {
        if (res && res.user) setUser(res.user);
      }).catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  const handleLogin = (user, token) => {
    localStorage.setItem('token', token);
    setUser(user);
    setView('candidates');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('candidates');
  };

  return (
    <div className="App">
      <nav className="App-nav">
        <div className="nav-brand">Blockchain Voting</div>
        <div className="nav-links">
          <button className={`nav-link ${view === 'candidates' ? 'active' : ''}`} onClick={() => setView('candidates')}>Candidates</button>
          {!user && <button className="nav-link" onClick={() => setView('login')}>Login</button>}
          {!user && <button className="nav-link" onClick={() => setView('register')}>Register</button>}
          {user && user.role === 'admin' && <button className="nav-link" onClick={() => setView('admin')}>Admin Dashboard</button>}
          {user && <button className="nav-link" onClick={handleLogout}>Logout</button>}
        </div>
      </nav>

      <main className="App-main">
        {view === 'login' && <Login onLogin={handleLogin} />}
        {view === 'register' && <Register onRegister={handleLogin} />}
        {view === 'candidates' && <Candidates token={localStorage.getItem('token')} />}
        {view === 'admin' && <Admin token={localStorage.getItem('token')} />}
      </main>
    </div>
  );
}

export default App;
