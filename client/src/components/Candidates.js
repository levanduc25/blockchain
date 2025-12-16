import React, { useEffect, useState } from 'react';
import api from '../api';
import { useWeb3 } from '../contexts/Web3Context';

export default function Candidates({ token }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const { contract, account, connectWallet } = useWeb3();

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
    if (!account) {
      // Try to connect if not connected
      try {
        await connectWallet();
      } catch (e) {
        return setMessage('Please connect your Metamask wallet to vote');
      }
    }

    if (!contract) return setMessage('Blockchain contract not loaded');

    setMessage('Waiting for transaction signature...');

    try {
      // 1. Send transaction to Blockchain
      const receipt = await contract.methods.vote(candidate.candidateId).send({ from: account });

      setMessage('Transaction confirmed! Recording vote...');

      // 2. Record vote in Backend
      const res = await api.castVote(token, {
        candidateId: candidate._id,
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed)
      });
      setMessage(res.message || 'Vote submitted successfully!');

      // Update candidate list to show new vote count
      setCandidates(prev => prev.map(c =>
        c._id === candidate._id ? { ...c, voteCount: (c.voteCount || 0) + 1 } : c
      ));

    } catch (err) {
      console.error(err);
      // Handle Metamask user rejection or other errors
      if (err.code === 4001) {
        setMessage('Transaction rejected by user');
      } else {
        setMessage(err.message || 'Vote failed on blockchain');
      }
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
          background: message.includes('failed') || message.includes('rejected') ? '#fef2f2' : '#f0fdf4',
          color: message.includes('failed') || message.includes('rejected') ? '#991b1b' : '#166534',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid currentColor'
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
                onClick={() => handleVote(c)}
              >
                Vote for {c.name}
              </button>
            </div>
          </div>
        ))}
        {candidates.length === 0 && <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No candidates found.</div>}
      </div>
    </div>
  );
}
