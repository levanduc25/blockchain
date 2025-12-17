import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useWeb3 } from "../contexts/Web3Context";
import Navigation from "./Navigation";

export default function Admin({ token }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const { contract, account, connectWallet } = useWeb3();

  useEffect(() => {
    if (!token) {
      setError("Admin token missing");
      navigate("/login");
      return;
    }

    // Load user
    api.getMe(token).then(res => {
      if (res && res.user) setUser(res.user);
    }).catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    });

    api.getAdminDashboard(token).then((res) => {
      setDashboard(res);
    }).catch((err) => {
      setError(err.message || "Failed to load admin dashboard");
    });

    // Load candidates
    loadCandidates();

    // Load events
    loadEvents();
  }, [token, navigate]);

  const loadCandidates = () => {
    setLoadingCandidates(true);
    api.getCandidates().then(res => {
      if (res && res.data) setCandidates(res.data);
    }).catch(console.error).finally(() => setLoadingCandidates(false));
  };

  const loadEvents = () => {
    setLoadingEvents(true);
    api.getEvents().then(res => {
      if (res && res.data) setEvents(res.data);
    }).catch(console.error).finally(() => setLoadingEvents(false));
  };

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await api.deleteCandidate(token, id);
      alert('Candidate deleted successfully');
      loadCandidates();
    } catch (err) {
      alert(err.message || 'Failed to delete candidate');
    }
  };

  const handleVerifyCandidate = async (candidate) => {
    if (!account) {
      try {
        await connectWallet();
      } catch (e) {
        return alert('Please connect your MetaMask wallet');
      }
    }

    if (!contract) return alert('Blockchain contract not loaded');

    try {
      // Call verify on blockchain
      await contract.methods.verifyCandidate(candidate.candidateId).send({ from: account });

      // Then update in DB
      await api.verifyCandidate(token, candidate._id);

      alert('Candidate verified successfully');
      loadCandidates();
    } catch (err) {
      console.error(err);
      alert('Failed to verify candidate: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!dashboard) return <div>Loading admin data...</div>;

  return (
    <div className="App">
      <Navigation user={user} onLogout={handleLogout} />

      <main className="App-main">
        <div>
          <h2 style={{ marginBottom: "2rem" }}>Admin Dashboard</h2>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Candidate Management</h3>
            <p style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>
              Candidates register themselves via the Candidate Registration page. 
              Review and verify applications below.
            </p>
            <CandidateList token={token} />
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Voter Management</h3>
            <UserList token={token} />
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Event Management</h3>
            <AddEventForm token={token} onSuccess={loadEvents} />
            <EventList token={token} events={events} onDelete={loadEvents} />
          </div>
        </div>
      </main>
    </div>
  );
}

function UserList({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    api
      .getAllVoters(token)
      .then((res) => {
        setUsers(res.voters);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleVerifyVoter = async (userId) => {
    if (!window.confirm("Are you sure you want to verify this voter?")) return;
    try {
      await api.verifyVoter(token, userId);
      await fetchUsers(); // Refresh the list
      alert("Voter verified successfully!");
    } catch (err) {
      alert(err.message || "Failed to verify voter");
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm("Are you sure you want to promote this user to Admin?")) return;
    try {
      await api.updateUserRole(token, userId, "admin");
      alert("User promoted to Admin successfully!");
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to update role");
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--border-color)",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "0.75rem" }}>Username</th>
            <th style={{ padding: "0.75rem" }}>Full Name</th>
            <th style={{ padding: "0.75rem" }}>Email</th>
            <th style={{ padding: "0.75rem" }}>Registered</th>
            <th style={{ padding: "0.75rem" }}>Verified</th>
            <th style={{ padding: "0.75rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((voter) => (
            <tr
              key={voter._id}
              style={{ borderBottom: "1px solid var(--bg-body)" }}
            >
              <td style={{ padding: "0.75rem" }}>{voter.user ? voter.user.username : 'N/A'}</td>
              <td style={{ padding: "0.75rem" }}>{voter.aadharInfo ? voter.aadharInfo.fullName : 'N/A'}</td>
              <td style={{ padding: "0.75rem" }}>{voter.user ? voter.user.email : 'N/A'}</td>
              <td style={{ padding: "0.75rem" }}>
                <span
                  style={{
                    padding: "0.125rem 0.5rem",
                    borderRadius: "999px",
                    background: voter.isRegistered ? "#dcfce7" : "#fef2f2",
                    color: voter.isRegistered ? "#166534" : "#991b1b",
                    fontSize: "0.75rem",
                  }}
                >
                  {voter.isRegistered ? "Yes" : "No"}
                </span>
              </td>
              <td style={{ padding: "0.75rem" }}>
                <span
                  style={{
                    padding: "0.125rem 0.5rem",
                    borderRadius: "999px",
                    background: voter.isVerified ? "#dcfce7" : "#fef2f2",
                    color: voter.isVerified ? "#166534" : "#991b1b",
                    fontSize: "0.75rem",
                  }}
                >
                  {voter.isVerified ? "Yes" : "No"}
                </span>
              </td>
              <td style={{ padding: "0.75rem" }}>
                {!voter.isVerified && (
                  <button
                    onClick={() => handleVerifyVoter(voter.user ? voter.user._id : voter._id)}
                    style={{
                      background: "#10b981",
                      border: "none",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Verify
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

function ElectionStateManager({ token }) {
  const [currentState, setCurrentState] = useState("Registration");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Load current state from backend or blockchain
    api
      .getElectionState(token)
      .then((res) => {
        if (res && res.currentState) setCurrentState(res.currentState);
      })
      .catch(console.error);
  }, [token]);

  const handleChangeState = async (newState) => {
    if (
      !window.confirm(
        `Are you sure you want to change election state to ${newState}?`
      )
    )
      return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.changeElectionState(token, { newState });
      setMessage(res.message || "State changed successfully!");
      setCurrentState(newState);
    } catch (err) {
      setMessage(err.message || "Failed to change state");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <strong>Current State:</strong> {currentState}
      </div>
      {message && (
        <div
          style={{
            background: message.includes("failed") ? "#fef2f2" : "#f0fdf4",
            color: message.includes("failed") ? "#991b1b" : "#166534",
            padding: "0.5rem",
            borderRadius: "0.25rem",
            marginBottom: "1rem",
          }}
        >
          {message}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {["Registration", "Voting", "Ended"].map((state) => (
          <button
            key={state}
            onClick={() => handleChangeState(state)}
            disabled={loading || currentState === state}
            style={{
              background: currentState === state ? "#6b7280" : "#3b82f6",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              cursor:
                loading || currentState === state ? "not-allowed" : "pointer",
              opacity: loading || currentState === state ? 0.5 : 1,
            }}
          >
            {loading ? "Changing..." : `Set to ${state}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// AddCandidateForm removed - candidates now self-register via CandidateRegistration component

function AddEventForm({ token, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    type: "announcement",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.addEvent(token, formData);
      setMessage({ type: "success", text: "Event created successfully!" });
      setFormData({
        title: "",
        description: "",
        date: "",
        location: "",
        type: "announcement",
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "Failed to create event",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h4>Add New Event</h4>
      {message && (
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            background:
              message.type === "error"
                ? "#fef2f2"
                : message.type === "success"
                ? "#f0fdf4"
                : "#eff6ff",
            color:
              message.type === "error"
                ? "#991b1b"
                : message.type === "success"
                ? "#166534"
                : "#1e40af",
            border: "1px solid currentColor",
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Title
          </label>
          <input
            className="input-field"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Type
          </label>
          <select
            className="input-field"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="election">Election</option>
            <option value="announcement">Announcement</option>
            <option value="meeting">Meeting</option>
            <option value="debate">Debate</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Date
          </label>
          <input
            className="input-field"
            name="date"
            type="datetime-local"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontWeight: 500,
            }}
          >
            Location
          </label>
          <input
            className="input-field"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label
          style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}
        >
          Description
        </label>
        <textarea
          className="input-field"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: "100%" }}
      >
        {loading ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}

function EventList({ token, events, onDelete }) {
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.deleteEvent(token, eventId);
      alert("Event deleted successfully!");
      if (onDelete) onDelete();
    } catch (err) {
      alert(err.message || "Failed to delete event");
    }
  };

  const handleVerifyEvent = async (eventId) => {
    try {
      await api.verifyEvent(token, eventId);
      alert("Event verified successfully!");
      if (onDelete) onDelete(); // Refresh events
    } catch (err) {
      alert(err.message || "Failed to verify event");
    }
  };

  return (
    <div>
      <h4>Existing Events</h4>
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {events.map((event) => (
            <div
              key={event._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "1rem",
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h5 style={{ margin: "0 0 0.5rem 0" }}>{event.title}</h5>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>
                    <strong>Type:</strong> {event.type} | <strong>Date:</strong> {new Date(event.date).toLocaleString()} | <strong>Verified:</strong> {event.isVerified ? "Yes" : "No"}
                  </p>
                  {event.location && (
                    <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>
                      <strong>Location:</strong> {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p style={{ margin: 0 }}>{event.description}</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!event.isVerified && (
                    <button
                      onClick={() => handleVerifyEvent(event._id)}
                      style={{
                        background: "#10b981",
                        border: "none",
                        color: "white",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                      }}
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateList({ token }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = () => {
    setLoading(true);
    api
      .getCandidates(token)
      .then((res) => {
        setCandidates(res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCandidates();
  }, [token]);

  const handleVerifyCandidate = async (candidateId) => {
    if (!window.confirm("Are you sure you want to approve this candidate application?")) return;
    try {
      await api.verifyCandidate(token, candidateId);
      alert("Candidate application approved!");
      fetchCandidates();
    } catch (err) {
      alert(err.message || "Failed to approve candidate application");
    }
  };

  if (loading) return <div>Loading candidates...</div>;

  return (
    <div>
      <h4>Candidate Applications</h4>
      {candidates.length === 0 ? (
        <p>No candidate applications found.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {candidates.map((candidate) => (
            <div
              key={candidate._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "1rem",
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h5 style={{ margin: "0 0 0.5rem 0" }}>{candidate.name}</h5>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>
                    <strong>Party:</strong> {candidate.party} | <strong>Age:</strong> {candidate.age}
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        padding: "0.125rem 0.5rem",
                        borderRadius: "999px",
                        background: candidate.isVerified ? "#dcfce7" : "#fef3c7",
                        color: candidate.isVerified ? "#166534" : "#92400e",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {candidate.isVerified ? "Verified" : "Pending Review"}
                    </span>
                  </p>
                  {candidate.qualification && (
                    <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>
                      <strong>Qualification:</strong> {candidate.qualification}
                    </p>
                  )}
                  {candidate.manifesto && (
                    <p style={{ margin: 0 }}>{candidate.manifesto}</p>
                  )}
                </div>
                {!candidate.isVerified && (
                  <button
                    onClick={() => handleVerifyCandidate(candidate._id)}
                    style={{
                      background: "#10b981",
                      border: "none",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Approve Application
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
