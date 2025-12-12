import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Candidates({ token }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getCandidates().then(res => {
      if (res && res.data) setCandidates(res.data);
    }).catch(err => {
      console.error(err);
      setMessage('Failed to load candidates');
    }).finally(() => setLoading(false));
  }, []);

  const handleVote = async (candidate) => {
    if (!token) return setMessage('You must be logged in to vote');

    // For demo: prompt user to enter blockchain tx info
    const txHash = window.prompt('Enter transaction hash (txHash) from blockchain:');
    if (!txHash) return;
    const blockNumber = window.prompt('Enter block number:');
    const gasUsed = window.prompt('Enter gas used:');

    try {
      const res = await api.castVote(token, {
        candidateId: candidate._id,
        transactionHash: txHash,
        blockNumber: Number(blockNumber),
        gasUsed: Number(gasUsed)
      });
      setMessage(res.message || 'Vote submitted');
    } catch (err) {
      setMessage(err.message || 'Vote failed');
    }
  };

  if (loading) return <div>Loading candidates...</div>;

  return (
    <div>
      <h2>Candidates</h2>
      {message && <div>{message}</div>}
      <ul>
        {candidates.map(c => (
          <li key={c._id} style={{ marginBottom: 12 }}>
            <strong>{c.name}</strong> — {c.party} — Votes: {c.voteCount || 0}
            <div>{c.manifesto}</div>
            <button onClick={() => handleVote(c)}>Vote</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
