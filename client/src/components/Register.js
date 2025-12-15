import React, { useState } from 'react';
import api from '../api';

export default function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.register({ username, email, password, walletAddress });
      if (res && res.token) {
        onRegister(res.user, res.token);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Register</h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Username</label>
            <input
              className="input-field"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Email</label>
            <input
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Password</label>
            <input
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Wallet address (optional)</label>
            <input
              className="input-field"
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
          {error && <div style={{ color: 'red', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
