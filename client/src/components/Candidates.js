import React, { useEffect, useState } from 'react';
import api from '../api';
import { useWeb3 } from '../contexts/Web3Context';

export default function Candidates({ token }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [electionState, setElectionState] = useState('Registration');
  const { contract, account, web3, connectWallet } = useWeb3();

  useEffect(() => {
    api.getCandidates().then(res => {
      if (res && res.data) setCandidates(res.data);
    }).catch(err => {
      console.error(err);
      setMessage('Failed to load candidates');
    }).finally(() => setLoading(false));

    if (token) {
      api.getVoterProfile(token).then(res => {
        if (res && res.voter) setUserProfile(res.voter);
      }).catch(console.error);

      api.getElectionState(token).then(res => {
        if (res && res.currentState) setElectionState(res.currentState);
      }).catch(console.error);
    }
  }, [token]);

  const handleRegisterVoter = async () => {
    if (!token) return setMessage('You must be logged in');
    if (!account) {
      try {
        await connectWallet();
      } catch (e) {
        return setMessage('Please connect your Metamask wallet');
      }
    }

    if (!contract) return setMessage('Blockchain contract not loaded');

    setMessage('Registering on blockchain...');

    try {
      // Call registerVoter on blockchain
      await contract.methods.registerVoter().send({ from: account });

      setMessage('Transaction confirmed! Saving registration...');

      // Save to backend
      const res = await api.registerVoter(token);
      setMessage(res.message || 'Registered successfully!');

      // Refresh profile
      const profileRes = await api.getVoterProfile(token);
      if (profileRes && profileRes.voter) setUserProfile(profileRes.voter);

    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setMessage('Transaction rejected by user');
      } else {
        setMessage(err.message || 'Registration failed');
      }
    }
  };

  const handleVote = async (candidate) => {
    if (!token) return setMessage('You must be logged in to vote');
    if (!account) {
      try {
        await connectWallet();
      } catch (e) {
        return setMessage('Please connect your Metamask wallet to vote');
      }
    }

    if (!contract) return setMessage('Blockchain contract not loaded');

    if (!userProfile) return setMessage('User profile not loaded');
    if (!userProfile.isRegistered) return setMessage('You must register as voter first');
    if (!userProfile.isVerified) return setMessage('Your account is not verified yet. Please wait for admin approval.');
    if (electionState !== 'Voting') return setMessage(`Election is in ${electionState} phase. Voting is not active.`);

    // Validate candidateId
    if (candidate.candidateId == null || typeof candidate.candidateId !== 'number' || candidate.candidateId <= 0) {
      return setMessage('Invalid candidate (missing or invalid blockchain ID)');
    }

    setMessage('Waiting for transaction signature...');

    try {
      // Debug logging
      console.log('Voting details:', {
        candidateId: candidate.candidateId,
        type: typeof candidate.candidateId,
        account,
        candidateName: candidate.name
      });

      // Simulate the transaction to catch revert reasons
      try {
        await contract.methods.vote(candidate.candidateId).call({ 
          from: account,
          value: web3.utils.toWei('0.001', 'ether')
        });
      } catch (simErr) {
        console.error('Simulation failed:', simErr);
        throw new Error(`Transaction would fail: ${simErr.message || 'Internal JSON-RPC error'}`);
      }

      // 1. Send transaction to Blockchain with required ETH
      const receipt = await contract.methods.vote(candidate.candidateId).send({ 
        from: account,
        value: web3.utils.toWei('0.001', 'ether') // Required for payable function
      });

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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Election Phase: <strong>{electionState}</strong></span>
          {token && userProfile && !userProfile.isRegistered && (
            <button
              className="btn"
              style={{ background: '#f59e0b', color: 'white', border: 'none' }}
              onClick={handleRegisterVoter}
            >
              Register as Voter
            </button>
          )}
          <span style={{ color: 'var(--text-muted)' }}>{candidates.length} candidates available</span>
        </div>
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
                disabled={electionState !== 'Voting'}
              >
                {electionState === 'Voting' ? `Vote for ${c.name}` : `Voting ${electionState === 'Registration' ? 'Not Started' : 'Ended'}`}
              </button>
            </div>
          </div>
        ))}
        {candidates.length === 0 && <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No candidates found.</div>}
      </div>
    </div>
  );
}
