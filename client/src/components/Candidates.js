import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Candidates({ token }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    api.getCandidates().then(res => {
      if (res && res.data) setCandidates(res.data);
    }).catch(err => {
      console.error(err);
      setMessage('Failed to load candidates');
    }).finally(() => setLoading(false));
  }, []);

  const handleVoteClick = (candidate) => {
    if (!token) return setMessage('You must be logged in to vote');
    setSelectedCandidate(candidate);
  };

  const handleVoteSubmit = async (txData) => {
    try {
      const res = await api.castVote(token, {
        candidateId: selectedCandidate._id,
        transactionHash: txData.txHash,
        blockNumber: Number(txData.blockNumber),
        gasUsed: Number(txData.gasUsed)
      });
      setMessage(res.message || 'Vote submitted');
    } catch (err) {
      setMessage(err.message || 'Vote failed');
    } finally {
      setSelectedCandidate(null);
    }
  };

  if (loading) return <div>Loading candidates...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Candidates</h2>
        <span style={{ color: 'var(--text-muted)' }}>{candidates.length} candidates available</span>
      </div>

      {message && (
        <div style={{
          background: message.includes('failed') ? '#fef2f2' : '#f0fdf4',
          color: message.includes('failed') ? '#991b1b' : '#166534',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          {message}
        </div>
      )}

      <div className="candidates-grid">
        {candidates.map(c => (
          <div key={c._id} className="card candidate-card">
            <div className="candidate-header">
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{c.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>ID: {c.candidateId ?? 'N/A'}</div>
              </div>
              <span className="party-badge">{c.party}</span>
            </div>

            <div style={{ flex: 1, marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
              {c.manifesto || 'No manifesto provided.'}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Votes</span>
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{c.voteCount || 0}</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleVoteClick(c)}
              >
                Vote for {c.name}
              </button>
            </div>
          </div>
        ))}
        {candidates.length === 0 && <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No candidates found.</div>}
      </div>

      {selectedCandidate && (
        <VoteModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onSubmit={handleVoteSubmit}
        />
      )}
    </div>
  );
}

function VoteModal({ candidate, onClose, onSubmit }) {
  const [txHash, setTxHash] = useState('0x123abcFakeHashForDemo');
  const [blockNumber, setBlockNumber] = useState('100');
  const [gasUsed, setGasUsed] = useState('21000');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ txHash, blockNumber, gasUsed });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.2s' }}>
        <h3 style={{ marginTop: 0 }}>Confirm Vote</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          You are voting for <strong>{candidate.name}</strong>. Please enter the blockchain transaction details below (Demo Mode).
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Transaction Hash</label>
            <input
              className="input-field"
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              required
              placeholder="0x..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Block Number</label>
              <input
                className="input-field"
                type="number"
                value={blockNumber}
                onChange={e => setBlockNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Gas Used</label>
              <input
                className="input-field"
                type="number"
                value={gasUsed}
                onChange={e => setGasUsed(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{ flex: 1, background: 'var(--bg-body)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Confirm Vote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
