const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export default {
  register: (body) => request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),

  login: (body) => request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }),

  getMe: (token) => request('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }),

  getCandidates: () => request('/candidate', { method: 'GET' }),

  getResults: () => request('/candidate/results', { method: 'GET' }),

  castVote: (token, body) => request('/voter/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  }),

  getAdminDashboard: (token) => request('/admin/dashboard', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }),

  addCandidate: (token, body) => request('/candidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  }),

  getAllUsers: (token) => request('/admin/users', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }),

  updateUserRole: (token, userId, role) => request(`/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role })
  })
};
