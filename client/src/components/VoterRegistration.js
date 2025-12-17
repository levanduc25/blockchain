import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navigation from './Navigation';

export default function VoterRegistration({ user, onLogout }) {
  const [formData, setFormData] = useState({
    cccd: '',
    accountAddress: '',
    fullName: user ? user.username : '',
    gender: 'Other',
    address: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Check if already verified
  useEffect(() => {
    if (user && user.isVerified) {
      setMessage('Bạn đã đăng ký và được xác thực. Hãy đến phần Events để vote.');
      setTimeout(() => navigate('/events'), 3000);
    }
  }, [user, navigate]);

  if (user && user.isVerified) {
    return (
      <div className="App">
        <Navigation user={user} onLogout={onLogout} />
        <main className="App-main">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Đăng ký cử tri</h2>
            <p style={{ color: 'green' }}>Bạn đã đăng ký và được xác thực. Hãy đến phần Events để vote.</p>
            <button onClick={() => navigate('/events')} className="btn btn-primary">Đến Events</button>
          </div>
        </main>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('You must be logged in');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Assuming there's an API for voter registration with CCCD
      // For now, using existing registerVoter, but we can extend it
      const res = await api.registerVoter(token, formData);
      setMessage(res.message || 'Voter registered successfully!');
    } catch (err) {
      setMessage(err.message || 'Failed to register voter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Navigation user={user} onLogout={onLogout} />
      <main className="App-main">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2>Voter Registration</h2>
          <form onSubmit={handleSubmit} className="card">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="cccd" style={{ display: 'block', marginBottom: '0.5rem' }}>
                CCCD (Citizen ID):
              </label>
              <input
                type="text"
                id="cccd"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                placeholder="Enter your CCCD (10-12 digits)"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="fullName" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Full Name:
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                placeholder="Enter your full name"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="gender" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Gender:
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="address" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Address:
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                placeholder="Enter your address"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Phone Number:
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                placeholder="Enter your phone number (10 digits)"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="accountAddress" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Account Address:
              </label>
              <input
                type="text"
                id="accountAddress"
                name="accountAddress"
                value={formData.accountAddress}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
                placeholder="Enter your account address"
              />
            </div>

            {message && (
              <div style={{ marginBottom: '1rem', color: message.includes('success') ? 'green' : 'red' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Registering...' : 'Register as Voter'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}