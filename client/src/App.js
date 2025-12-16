import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Candidates from './components/Candidates';
import Admin from './components/Admin';
import api from './api';

import { Web3Provider, useWeb3 } from './contexts/Web3Context';

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

function AppContent() {
  const [view, setView] = useState('candidates');
  const [user, setUser] = useState(null);
  const { account, connectWallet } = useWeb3();

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

          <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
            {account ? (
              <span className="party-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
            ) : (
              <button
                className="btn"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: '#f59e0b', color: 'white', border: 'none' }}
                onClick={connectWallet}
              >
                Connect Wallet
              </button>
            )}
          </div>
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
