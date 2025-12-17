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
  const { contract, account, connectWallet, error } = useWeb3();
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
      if (res && res.data) {
        console.log('Loaded candidates:', res.data);
        setCandidates(res.data);
      }
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
    console.log('\n========================================');
    console.log('🗳️  VOTE ATTEMPT STARTED');
    console.log('========================================');
    console.log('📋 Candidate Info:');
    console.log('   - Name:', candidate.name);
    console.log('   - Party:', candidate.party);
    console.log('   - MongoDB _id:', candidate._id);
    console.log('   - Blockchain candidateId:', candidate.candidateId);
    console.log('   - candidateId type:', typeof candidate.candidateId);
    console.log('   - Is null/undefined?', candidate.candidateId == null);
    console.log('   - Raw value:', JSON.stringify(candidate.candidateId));

    // Step 1: Authentication checks
    if (!token) {
      console.log('❌ No authentication token');
      return setMessage('You must be logged in to vote');
    }
    
    if (!account) {
      console.log('⚠️  Wallet not connected, attempting to connect...');
      try {
        await connectWallet();
        console.log('✅ Wallet connected');
      } catch (e) {
        console.log('❌ Wallet connection failed');
        return setMessage('Please connect your Metamask wallet to vote');
      }
    }

    if (!contract) {
      console.log('❌ Smart contract not loaded');
      return setMessage('Blockchain contract not loaded');
    }

    // Step 2: Profile validation
    if (!userProfile) {
      console.log('❌ User profile not loaded');
      return setMessage('User profile not loaded');
    }
    
    if (!userProfile.isRegistered) {
      console.log('❌ User not registered as voter');
      return setMessage('You must register as voter first');
    }
    
    if (!userProfile.isVerified) {
      console.log('❌ User not verified by admin');
      return setMessage('Your account is not verified yet. Please wait for admin approval.');
    }

    // Step 3: Election state check
    if (electionState !== 'Voting') {
      console.log('❌ Election not in voting phase. Current phase:', electionState);
      return setMessage(`Election is in ${electionState} phase. Voting is not active.`);
    }

    // Step 4: CRITICAL - Candidate ID validation
    console.log('\n🔍 VALIDATING CANDIDATE ID:');
    
    if (candidate.candidateId === null || candidate.candidateId === undefined) {
      console.log('❌ candidateId is null or undefined');
      return setMessage('This candidate has not been verified on the blockchain yet. Admin must verify first.');
    }

    const candidateIdNum = Number(candidate.candidateId);
    console.log('   - Converted to Number:', candidateIdNum);
    console.log('   - Is NaN?', isNaN(candidateIdNum));
    console.log('   - Is <= 0?', candidateIdNum <= 0);

    if (isNaN(candidateIdNum)) {
      console.log('❌ candidateId is not a valid number');
      return setMessage('This candidate has an invalid blockchain ID format.');
    }

    if (candidateIdNum <= 0) {
      console.log('❌ candidateId must be positive integer');
      return setMessage('This candidate has an invalid blockchain ID (must be > 0).');
    }

    console.log('✅ Candidate ID validation passed!');

    // Step 5: Prepare transaction
    console.log('\n📝 TRANSACTION DETAILS:');
    console.log('   - Contract Address:', contract.options.address);
    console.log('   - Voter Address:', account);
    console.log('   - Candidate Blockchain ID:', candidateIdNum);
    console.log('   - Vote Fee: 0.001 ETH');
    console.log('   - Method: vote(uint256)');

    setMessage('Waiting for transaction signature...');

    try {
      console.log('\n⏳ Sending transaction to blockchain...');
      
      const receipt = await contract.methods.vote(candidateIdNum).send({ 
        from: account, 
        value: '1000000000000000' // 0.001 ETH
      });

      console.log('\n✅ BLOCKCHAIN TRANSACTION SUCCESSFUL!');
      console.log('   - Transaction Hash:', receipt.transactionHash);
      console.log('   - Block Number:', receipt.blockNumber);
      console.log('   - Gas Used:', receipt.gasUsed);

      setMessage('Transaction confirmed! Recording vote in database...');

      // Step 6: Record vote in backend
      console.log('\n📤 Sending vote data to backend...');
      const voteData = {
        candidateId: candidate._id,
        transactionHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed)
      };
      console.log('   - Vote Data:', voteData);

      const res = await api.castVote(token, voteData);
      
      console.log('✅ Backend recorded vote successfully!');
      console.log('   - Response:', res.message);

      setMessage(res.message || 'Vote submitted successfully! 🎉');

      // Update local vote count
      setCandidates(prev => prev.map(c =>
        c._id === candidate._id ? { ...c, voteCount: (c.voteCount || 0) + 1 } : c
      ));

      console.log('========================================');
      console.log('✅ VOTE COMPLETED SUCCESSFULLY');
      console.log('========================================\n');

    } catch (err) {
      console.log('\n========================================');
      console.log('❌ VOTE FAILED');
      console.log('========================================');
      console.error('Error details:', err);
      
      if (err.code === 4001) {
        console.log('User rejected the transaction');
        setMessage('Transaction rejected by user');
      } else if (err.message) {
        console.log('Error message:', err.message);
        setMessage(`Vote failed: ${err.message}`);
      } else {
        console.log('Unknown error occurred');
        setMessage('Vote failed on blockchain. Please try again.');
      }
      console.log('========================================\n');
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
                <span className="party-badge" style={{ background: '#dbeafe', color: '#1e40af', padding: '0.5rem 1rem' }}>
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              ) : (
                <button
                  className="btn"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#f59e0b', color: 'white', border: 'none' }}
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
            background: message.includes('failed') || message.includes('rejected') || message.includes('invalid') || message.includes('not verified') ? '#fef2f2' : '#f0fdf4',
            color: message.includes('failed') || message.includes('rejected') || message.includes('invalid') || message.includes('not verified') ? '#991b1b' : '#166534',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid currentColor'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid currentColor'
          }}>
            {error}
          </div>
        )}

        <div className="candidates-grid">
          {candidates.map(c => {
            const candidateIdNum = Number(c.candidateId);
            const hasValidId = c.candidateId != null && !isNaN(candidateIdNum) && candidateIdNum > 0;
            
            return (
              <div key={c._id} className="card candidate-card">
                <div className="candidate-header">
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{c.name}</div>
                    <div style={{ 
                      color: hasValidId ? 'var(--text-muted)' : '#ef4444', 
                      fontSize: '0.875rem',
                      fontWeight: hasValidId ? 'normal' : '600'
                    }}>
                      Blockchain ID: {hasValidId ? c.candidateId : '⚠️ Not Verified'}
                    </div>
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
                    style={{ 
                      width: '100%',
                      opacity: (electionState !== 'Voting' || !hasValidId) ? 0.6 : 1,
                      cursor: (electionState !== 'Voting' || !hasValidId) ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => handleVote(c)}
                    disabled={electionState !== 'Voting' || !hasValidId}
                  >
                    {electionState === 'Voting' ? 
                      (hasValidId ? `Vote for ${c.name}` : '⚠️ Not on Blockchain') : 
                      `Voting ${electionState === 'Registration' ? 'Not Started' : 'Ended'}`}
                  </button>
                </div>
              </div>
            );
          })}
          {candidates.length === 0 && (
            <div style={{ 
              fontStyle: 'italic', 
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem',
              gridColumn: '1 / -1'
            }}>
              No candidates found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}