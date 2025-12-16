import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Admin({ token }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return setError('Admin token missing');
    api.getAdminDashboard(token).then(res => {
      setDashboard(res);
    }).catch(err => {
      setError(err.message || 'Failed to load admin dashboard');
    });
  }, [token]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!dashboard) return <div>Loading admin data...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Admin Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Candidates</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {dashboard?.candidatesCount || 0}
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Voters</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {dashboard?.votersCount || 0}
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Votes Cast</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {dashboard?.totalVotes || 0}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Add New Candidate</h3>
          <AddCandidateForm token={token} onSuccess={() => window.location.reload()} />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Raw Data Debug</h3>
          <pre style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '0.5rem',
            overflow: 'auto',
            fontSize: '0.875rem',
            maxHeight: '300px'
          }}>
            {JSON.stringify(dashboard, null, 2)}
          </pre>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>User Management</h3>
        <UserList token={token} />
      </div>
    </div>
  );
}

function UserList({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    api.getAllUsers(token).then(res => {
      setUsers(res.users);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to promote this user to Admin?')) return;
    try {
      await api.updateUserRole(token, userId, 'admin');
      alert('User promoted to Admin successfully!');
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update role');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Username</th>
            <th style={{ padding: '0.75rem' }}>Email</th>
            <th style={{ padding: '0.75rem' }}>Role</th>
            <th style={{ padding: '0.75rem' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} style={{ borderBottom: '1px solid var(--bg-body)' }}>
              <td style={{ padding: '0.75rem' }}>{user.username}</td>
              <td style={{ padding: '0.75rem' }}>{user.email}</td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{
                  padding: '0.125rem 0.5rem',
                  borderRadius: '999px',
                  background: user.role === 'admin' ? '#dbeafe' : '#f1f5f9',
                  color: user.role === 'admin' ? '#1e40af' : '#475569',
                  fontSize: '0.75rem'
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '0.75rem' }}>
                {user.role !== 'admin' && (
                  <button
                    onClick={() => handleMakeAdmin(user._id)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Make Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useWeb3 } from '../contexts/Web3Context';

function AddCandidateForm({ token, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '', party: '', age: '', qualification: '', manifesto: '', photo: '', biography: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { contract, account } = useWeb3();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Check Web3 connection
    if (!contract || !account) {
      setLoading(false);
      return setMessage({ type: 'error', text: 'Please connect Metamask first!' });
    }

    try {
      setMessage({ type: 'info', text: 'Please confirm transaction in Metamask...' });

      // 2. Sign transaction on Blockchain
      const receipt = await contract.methods.addCandidate(formData.name, formData.party).send({ from: account });

      const txHash = receipt.transactionHash;
      const candidateId = receipt.events.CandidateAdded.returnValues.candidateId;

      setMessage({ type: 'info', text: 'Transaction confirmed! Saving details...' });

      // 3. Send metadata to Backend
      await api.addCandidate(token, {
        ...formData,
        txHash,
        candidateId: Number(candidateId)
      });

      setMessage({ type: 'success', text: 'Candidate added successfully!' });
      setFormData({ name: '', party: '', age: '', qualification: '', manifesto: '', photo: '', biography: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setMessage({ type: 'error', text: 'Transaction rejected by user' });
      } else {
        setMessage({ type: 'error', text: err.message || 'Failed to add candidate' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div style={{
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          background: message.type === 'error' ? '#fef2f2' : (message.type === 'info' ? '#eff6ff' : '#f0fdf4'),
          color: message.type === 'error' ? '#991b1b' : (message.type === 'info' ? '#1e40af' : '#166534'),
          border: '1px solid currentColor'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Name</label>
          <input className="input-field" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Party</label>
          <input className="input-field" name="party" value={formData.party} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Age</label>
          <input className="input-field" name="age" type="number" value={formData.age} onChange={handleChange} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Qualification</label>
          <input className="input-field" name="qualification" value={formData.qualification} onChange={handleChange} />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Photo URL</label>
        <input className="input-field" name="photo" value={formData.photo} onChange={handleChange} placeholder="https://example.com/photo.jpg" />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Biography</label>
        <textarea className="input-field" name="biography" value={formData.biography} onChange={handleChange} rows={2} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Manifesto</label>
        <textarea className="input-field" name="manifesto" value={formData.manifesto} onChange={handleChange} rows={3} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Processing...' : 'Add Candidate (Sign with Wallet)'}
      </button>
    </form>
  );
}
