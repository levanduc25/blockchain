import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useWeb3 } from '../contexts/Web3Context';
import Navigation from './Navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [electionState, setElectionState] = useState('Registration');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const { contract, account, connectWallet } = useWeb3();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Load user
    api.getMe(token).then(res => {
      if (res && res.user) setUser(res.user);
    }).catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    });

    // Load user profile
    api.getVoterProfile(token).then(res => {
      if (res && res.voter) setUserProfile(res.voter);
    }).catch(console.error);

    // Load candidates
    api.getCandidates().then(res => {
      if (res && res.data) setCandidates(res.data);
    }).catch(err => {
      console.error(err);
      setMessage('Failed to load candidates');
    });

    // Load election state
    api.getElectionState(token).then(res => {
      if (res && res.currentState) setElectionState(res.currentState);
    }).catch(console.error);

    setLoading(false);
  }, [token, navigate]);

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
      await contract.methods.registerVoter().send({ from: account });

      setMessage('Transaction confirmed! Saving registration...');

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

    setMessage('Waiting for transaction signature...');

    try {
      const receipt = await contract.methods.vote(candidate.candidateId).send({ from: account });

      setMessage('Transaction confirmed! Recording vote...');

      const res = await api.castVote(token, {
        candidateId: candidate._id,
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed)
      });
      setMessage(res.message || 'Vote submitted successfully!');

      setCandidates(prev => prev.map(c =>
        c._id === candidate._id ? { ...c, voteCount: (c.voteCount || 0) + 1 } : c
      ));

    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setMessage('Transaction rejected by user');
      } else {
        setMessage(err.message || 'Vote failed on blockchain');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      <Navigation user={user} onLogout={handleLogout} />

      <main className="App-main">
        <div style={{ marginBottom: '2rem' }}>
          <h2>Election Dashboard</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span><strong>Current Phase:</strong> {electionState}</span>
            <span><strong>Total Candidates:</strong> {candidates.length}</span>
            {userProfile && !userProfile.isRegistered && (
              <button
                className="btn"
                style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                onClick={handleRegisterVoter}
              >
                Register as Voter
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              {account ? (
                <span className="party-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              ) : (
                <button
                  className="btn"
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: '#f59e0b', color: 'white', border: 'none' }}
                  onClick={connectWallet}
                >
                  Connect Wallet
                </button>
              )}
            </div>
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
      </main>
    </div>
  );
}