import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navigation({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="App-nav">
      <div className="nav-brand" onClick={() => navigate(user?.role === 'candidate' ? '/candidate-registration' : '/voter-registration')} style={{ cursor: 'pointer' }}>
        Blockchain Voting
      </div>
      <div className="nav-links">
        <button className="nav-link" onClick={() => navigate('/information')}>
          Information
        </button>
        
        {user?.role === 'voter' && !user?.isVerified && (
          <button className="nav-link" onClick={() => navigate('/voter-registration')}>
            Voter Registration
          </button>
        )}
        {user?.role === 'voter' && user?.isVerified && (
          <button className="nav-link" onClick={() => navigate('/events')}>
            Voting Events
          </button>
        )}
        {user?.role === 'candidate' && (
          <button className="nav-link" onClick={() => navigate('/candidate-registration')}>
            Candidate Registration
          </button>
        )}
        {user?.role === 'admin' && (
          <button className="nav-link" onClick={() => navigate('/admin')}>
              Admin Dashboard
          </button>
          
        )}
        {user?.role === 'admin' && (
          <button className="nav-link" onClick={() => navigate('/events')}>
            Events
          </button>
        )}
      </div>
      <div className="nav-footer">
        <div className="nav-link" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          Welcome, {user?.username}
        </div>
        <button className="nav-link" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}