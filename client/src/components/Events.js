import React, { useEffect, useState } from 'react';
import Navigation from './Navigation';
import api from '../api';
import { useWeb3 } from '../contexts/Web3Context';

export default function Events({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [votingEvent, setVotingEvent] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voting, setVoting] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const { contract, account, connectWallet, web3 } = useWeb3();

  useEffect(() => {
    // Fetch events - no token needed for public viewing
    api.getEvents().then(res => {
      if (res && res.data) setEvents(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleEventClick = (event) => {
    if (user && user.role === 'admin') {
      setSelectedEvent(event);
      loadCandidates();
    } else if (user && user.role === 'voter' && event.isVerified) {
      if (event.type === 'election') {
        setVotingEvent(event);
        loadCandidates();
      } else {
        setViewingEvent(event);
      }
    }
  };

  const loadCandidates = () => {
    setLoadingCandidates(true);
    api.getCandidates().then(res => {
      if (res && res.data) setCandidates(res.data);
    }).catch(console.error).finally(() => setLoadingCandidates(false));
  };

  const handleVote = async () => {
    if (!selectedCandidate || !votingEvent) return;
    setVoting(true);
    try {
      if (!account) {
        await connectWallet();
      }
      if (!contract) {
        alert('Contract not loaded');
        return;
      }

      // Send vote transaction with ETH
      const voteAmount = web3.utils.toWei('0.01', 'ether'); // 0.01 ETH
      await contract.methods.vote(selectedCandidate.candidateId).send({
        from: account,
        value: voteAmount
      });

      // Then save to DB
      const token = localStorage.getItem('token');
      await api.voteForEvent(token, votingEvent._id, selectedCandidate._id);

      alert('Vote cast successfully with 0.01 ETH!');
      setVotingEvent(null);
      setSelectedCandidate(null);
    } catch (error) {
      alert(error.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const handleAddCandidate = async (candidateId) => {
    if (!selectedEvent) return;
    setAddingCandidate(true);
    try {
      const token = localStorage.getItem('token');
      await api.addCandidateToEvent(token, selectedEvent._id, candidateId);
      // Refresh events
      api.getEvents().then(res => {
        if (res && res.data) setEvents(res.data);
        // Update selectedEvent
        const updatedEvent = res.data.find(e => e._id === selectedEvent._id);
        setSelectedEvent(updatedEvent);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setAddingCandidate(false);
    }
  };

  const handleRemoveCandidate = async (candidateId) => {
    if (!selectedEvent) return;
    setAddingCandidate(true);
    try {
      const token = localStorage.getItem('token');
      await api.removeCandidateFromEvent(token, selectedEvent._id, candidateId);
      // Refresh events
      api.getEvents().then(res => {
        if (res && res.data) setEvents(res.data);
        // Update selectedEvent
        const updatedEvent = res.data.find(e => e._id === selectedEvent._id);
        setSelectedEvent(updatedEvent);
      });
    } catch (error) {
      console.error(error);
    } finally {
      setAddingCandidate(false);
    }
  };

  return (
    <div className="App">
      <Navigation user={user} onLogout={onLogout} />
      <main className="App-main">
        <h2>{user && user.role === 'voter' ? 'Voting Events' : 'Events & Announcements'}</h2>

        {loading ? (
          <div>Loading events...</div>
        ) : events.filter(event => user && user.role === 'admin' ? true : (user && user.role === 'voter' ? event.type === 'election' && event.isVerified : event.isVerified)).length === 0 ? (
          <div className="card">
            <p>{user && user.role === 'voter' ? 'No verified election events available for voting.' : 'No events or announcements at this time.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {events
              .filter(event => user && user.role === 'admin' ? true : (user && user.role === 'voter' ? event.type === 'election' && event.isVerified : event.isVerified))
              .map(event => (
              <div 
                key={event._id} 
                className="card" 
                style={{ cursor: (user && (user.role === 'admin' || (user.role === 'voter' && event.isVerified))) ? 'pointer' : 'default' }}
                onClick={() => handleEventClick(event)}
              >
                <h3>{event.title}</h3>
                <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                  <strong>Type:</strong> {event.type.charAt(0).toUpperCase() + event.type.slice(1)} |
                  <strong> Date:</strong> {new Date(event.date).toLocaleString()}
                  {event.location && (
                    <> | <strong>Location:</strong> {event.location}</>
                  )}
                </div>
                {event.description && (
                  <p style={{ lineHeight: '1.6' }}>{event.description}</p>
                )}
                {event.candidates && event.candidates.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Candidates:</strong>
                    <ul>
                      {event.candidates.map(candidate => (
                        <li key={candidate._id}>{candidate.name} ({candidate.party})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedEvent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>Manage Candidates for {selectedEvent.title}</h3>
              
              {selectedEvent.candidates && selectedEvent.candidates.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4>Current Candidates:</h4>
                  {selectedEvent.candidates.map(candidate => (
                    <div key={candidate._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                      <span>{candidate.name} ({candidate.party})</span>
                      <button 
                        onClick={() => handleRemoveCandidate(candidate._id)}
                        disabled={addingCandidate}
                        className="btn"
                        style={{ backgroundColor: '#dc3545' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h4>Add Candidates:</h4>
              {loadingCandidates ? (
                <div>Loading candidates...</div>
              ) : candidates.length === 0 ? (
                <div>No candidates available</div>
              ) : (
                <div>
                  {candidates.map(candidate => (
                    <div key={candidate._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span>{candidate.name} ({candidate.party})</span>
                      <button 
                        onClick={() => handleAddCandidate(candidate._id)}
                        disabled={addingCandidate || selectedEvent.candidates.some(c => c._id === candidate._id)}
                        className="btn"
                      >
                        {selectedEvent.candidates.some(c => c._id === candidate._id) ? 'Added' : addingCandidate ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setSelectedEvent(null)} className="btn" style={{ marginTop: '1rem' }}>Close</button>
            </div>
          </div>
        )}

        {votingEvent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>Vote in {votingEvent.title}</h3>
              
              {loadingCandidates ? (
                <div>Loading candidates...</div>
              ) : candidates.length === 0 ? (
                <p>No candidates available.</p>
              ) : (
                <div>
                  <p>Select a candidate to vote for:</p>
                  {candidates.map(candidate => (
                    <div key={candidate._id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="radio"
                          name="candidate"
                          value={candidate._id}
                          checked={selectedCandidate === candidate._id}
                          onChange={() => setSelectedCandidate(candidate._id)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <div>
                          <strong>{candidate.name}</strong> ({candidate.party})
                          {candidate.qualification && <div>Qualification: {candidate.qualification}</div>}
                          {candidate.manifesto && <div>Manifesto: {candidate.manifesto}</div>}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={handleVote} 
                  disabled={!selectedCandidate || voting} 
                  className="btn btn-primary"
                >
                  {voting ? 'Voting...' : 'Vote'}
                </button>
                <button onClick={() => { setVotingEvent(null); setSelectedCandidate(null); }} className="btn">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {viewingEvent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>{viewingEvent.title}</h3>
              <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                <strong>Type:</strong> {viewingEvent.type.charAt(0).toUpperCase() + viewingEvent.type.slice(1)} |
                <strong> Date:</strong> {new Date(viewingEvent.date).toLocaleString()}
                {viewingEvent.location && (
                  <> | <strong>Location:</strong> {viewingEvent.location}</>
                )}
              </div>
              {viewingEvent.description && (
                <p style={{ lineHeight: '1.6' }}>{viewingEvent.description}</p>
              )}
              {viewingEvent.candidates && viewingEvent.candidates.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Candidates:</strong>
                  <ul>
                    {viewingEvent.candidates.map(candidate => (
                      <li key={candidate._id}>{candidate.name} ({candidate.party})</li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={() => setViewingEvent(null)} className="btn" style={{ marginTop: '1rem' }}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}