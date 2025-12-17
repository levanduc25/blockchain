import React from 'react';
import Navigation from './Navigation';

export default function Information({ user, onLogout }) {
  const renderContent = () => {
    if (user?.role === 'admin') {
      return (
        <>
          <h2>Admin Dashboard Overview</h2>
          <p>Welcome to the admin control panel. Here are your administrative functions:</p>
          
          <div className="card">
            <h3>🔧 System Management</h3>
            <ul>
              <li><strong>Candidate Management:</strong> Review and verify candidate applications</li>
              <li><strong>Voter Management:</strong> Verify voters, manage user roles, and oversee registrations</li>
              <li><strong>Election Control:</strong> Change election phases (Registration → Voting → Ended)</li>
              <li><strong>Candidate Management:</strong> Add and verify candidates on the blockchain</li>
              <li><strong>Event Management:</strong> Create announcements and manage election events</li>
            </ul>
          </div>

          <div className="card">
            <h3>⚙️ Blockchain Operations</h3>
            <ul>
              <li>Connect your MetaMask wallet to perform blockchain transactions</li>
              <li>All candidate additions require wallet signature</li>
              <li>Election state changes are recorded on the blockchain</li>
              <li>Monitor gas fees and transaction confirmations</li>
            </ul>
          </div>

          <div className="card">
            <h3>📊 Election Phases</h3>
            <ol>
              <li><strong>Registration Phase:</strong> Users can register as voters or candidates</li>
              <li><strong>Voting Phase:</strong> Registered voters can cast their votes</li>
              <li><strong>Ended Phase:</strong> Election results are finalized and displayed</li>
            </ol>
          </div>
        </>
      );
    } else if (user?.role === 'candidate') {
      return (
        <>
          <h2>Candidate Information</h2>
          <p>Welcome to your candidate dashboard. Here's what you need to know:</p>
          
          <div className="card">
            <h3>📝 Candidate Registration</h3>
            <ul>
              <li>Complete your candidate profile with detailed information</li>
              <li>Submit required documents and manifesto</li>
              <li>Wait for admin verification before appearing in elections</li>
              <li>Your information will be stored both in database and blockchain</li>
            </ul>
          </div>

          <div className="card">
            <h3>🗳️ Election Process</h3>
            <ul>
              <li>Registration phase: Submit your candidacy</li>
              <li>Voting phase: Campaign and engage with voters</li>
              <li>Results phase: View final election outcomes</li>
            </ul>
          </div>

          <div className="card">
            <h3>✅ Verification Status</h3>
            <ul>
              <li>Admin will verify your candidacy before election starts</li>
              <li>Once verified, you'll appear in the candidate list</li>
              <li>Voters can view your profile and manifesto</li>
            </ul>
          </div>
        </>
      );
    } else {
      // Default content for voters and guests
      return (
        <>
          <h2>Welcome to Blockchain Voting System</h2>
          <p>Here are some instructions for users:</p>
          
          <div className="card">
            <h3>🗳️ Voting Area</h3>
            <p>Secure and transparent voting powered by blockchain technology.</p>
          </div>

          <div className="card">
            <h3>1. Voter Registration</h3>
            <ul>
              <li>To vote, users need to register first. The voter registration form will be provided on this website.</li>
              <li>Users can only register during the registration phase. When the registration phase ends, users will not be able to register and therefore cannot vote.</li>
            </ul>
          </div>

          <div className="card">
            <h3>Registration Process</h3>
            <ul>
              <li>To register, users need to provide their Aadhar card number and the account address they will use to vote.</li>
              <li>In the initial stage, the user's age will be checked. Only users aged 18 and above are eligible to vote.</li>
              <li>The second stage is OTP verification. This stage requires users to confirm with OTP after successfully entering the Aadhar number and age check.</li>
              <li>After entering the correct OTP, the user will be successfully registered.</li>
            </ul>
          </div>

          <div className="card">
            <h3>2. Voting Process</h3>
            <ul>
              <li>The voting process is divided into three phases. All phases will be initiated and ended by the administrator. Users need to participate in the process according to the current phase.</li>
            </ul>
            <ol>
              <li><strong>Registration Phase:</strong> In this phase, user registration (who will vote) will be performed.</li>
              <li><strong>Voting Phase:</strong> After the voting phase is initiated by the administrator, users can vote in the voting area. Users just need to press the "VOTE" button, then the transaction will start, and after confirming the transaction, the vote will be cast successfully. After the voting phase ends, users will not be able to vote.</li>
              <li><strong>Results Phase:</strong> This is the final phase of the entire voting process, where the election results will be displayed in the "Results" section.</li>
            </ol>
          </div>
        </>
      );
    }
  };

  return (
    <div className="App">
      <Navigation user={user} onLogout={onLogout} />
      <main className="App-main">
        {renderContent()}
      </main>
    </div>
  );
}