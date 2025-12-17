import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [role, setRole] = useState('voter');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        if (res && res.token) {
          onLogin(res.user, res.token);
          navigate(res.user.role === 'candidate' ? '/candidate-registration' : '/voter-registration');
        }
      } else {
        const res = await api.register({ username, email, password, walletAddress, role });
        if (res && res.token) {
          onLogin(res.user, res.token);
          navigate('/voter-registration');
        }
      }
    } catch (err) {
      setError(err.message || (isLogin ? 'Login failed' : 'Registration failed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div style={{ display: 'flex', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`btn ${isLogin ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsLogin(true)}
            style={{ flex: 1, marginRight: '0.5rem' }}
          >
            Login
          </button>
          <button
            type="button"
            className={`btn ${!isLogin ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsLogin(false)}
            style={{ flex: 1 }}
          >
            Register
          </button>
        </div>
        <h2 style={{ marginTop: 0 }}>{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={submit}>
          {!isLogin && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Username</label>
              <input
                className="input-field"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
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
          {!isLogin && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Role</label>
                <select
                  className="input-field"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required={!isLogin}
                >
                  <option value="voter">Voter</option>
                  <option value="candidate">Candidate</option>
                </select>
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {isLogin ? 'Login' : 'Register'}
          </button>
          {error && <div style={{ color: 'red', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
