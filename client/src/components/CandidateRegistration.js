import React, { useState } from 'react';
import api from '../api';
import Navigation from './Navigation';

export default function CandidateRegistration({ user, onLogout }) {
  const [formData, setFormData] = useState({
    name: '',
    party: '',
    age: '',
    qualification: '',
    manifesto: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const token = localStorage.getItem('token');

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
      setMessage({
        type: "info",
        text: "Registering candidate...",
      });

      // Send to Backend
      await api.addCandidate(token, {
        ...formData,
      });

      setMessage({ type: "success", text: "Candidate registered successfully! Please wait for admin verification." });
      
      // Reset form
      setFormData({
        name: '',
        party: '',
        age: '',
        qualification: '',
        manifesto: '',
        address: ''
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err.message && typeof err.message === 'string' ? err.message : JSON.stringify(err.message) || "Failed to register candidate";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Navigation user={user} onLogout={onLogout} />
      <main className="App-main">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2>Candidate Registration</h2>

          <form onSubmit={handleSubmit} className="card">
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Full Name:
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="party" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Party:
                </label>
                <input
                  type="text"
                  id="party"
                  name="party"
                  value={formData.party}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your party name"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="age" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Age:
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your age"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="qualification" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Qualification:
                </label>
                <input
                  type="text"
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your qualification"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="manifesto" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Manifesto:
                </label>
                <textarea
                  id="manifesto"
                  name="manifesto"
                  value={formData.manifesto}
                  onChange={handleChange}
                  rows={4}
                  className="input-field"
                  placeholder="Enter your manifesto"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="address" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Wallet Address:
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your wallet address"
                />
              </div>

              {message && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                    background:
                      message.type === "error"
                        ? "#fef2f2"
                        : message.type === "info"
                        ? "#eff6ff"
                        : "#f0fdf4",
                    color:
                      message.type === "error"
                        ? "#991b1b"
                        : message.type === "info"
                        ? "#1e40af"
                        : "#166534",
                    border: "1px solid currentColor",
                  }}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Processing...' : 'Register'}
              </button>
            </form>
        </div>
      </main>
    </div>
  );
}