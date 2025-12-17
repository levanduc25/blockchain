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

  voteForEvent: (token, eventId, candidateId) => request(`/event/${eventId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ candidateId })
  }),
  updateCandidate: (token, id, body) => request(`/candidate/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  }),

  deleteCandidate: (token, id) => request(`/candidate/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }),

  verifyCandidate: (token, id) => request(`/candidate/${id}/verify`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  }),

  getEvents: () => request('/events', { method: 'GET' }),

  addCandidateToEvent: (token, eventId, candidateId) => request(`/events/${eventId}/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ candidateId })
  }),

  removeCandidateFromEvent: (token, eventId, candidateId) => request(`/events/${eventId}/candidates/${candidateId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }),

  addEvent: (token, body) => request('/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  }),

  updateEvent: (token, id, body) => request(`/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  }),

  deleteEvent: (token, id) => request(`/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }),

  verifyEvent: (token, eventId) => request(`/admin/verify-event/${eventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
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

  getVoterProfile: (token) => request('/voter/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }),

  registerVoter: (token, data) => request('/voter/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  }),

  verifyVoter: (token, userId) => request(`/admin/verify-voter/${userId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  }),

  changeElectionState: (token, body) => request('/admin/change-election-state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  }),

  getElectionState: (token) => request('/election/state', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }),

  updateUserRole: (token, userId, role) => request(`/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role })
  }),

  getAllUsers: (token) => request('/admin/users', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }),

  getAllVoters: (token) => request('/admin/voters', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
};
