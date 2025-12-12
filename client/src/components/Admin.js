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
      <h2>Admin Dashboard</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dashboard, null, 2)}</pre>
    </div>
  );
}
