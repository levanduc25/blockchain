require("dotenv").config();
const { Web3 } = require("web3");
const VotingSystemJSON = require("../../smart-contracts/build/contracts/VotingSystem.json");

// Kết nối RPC
const RPC_URL = process.env.RPC_URL;
const web3 = new Web3(RPC_URL);

// ABI từ Truffle
const contractABI = VotingSystemJSON.abi;

// Lấy PRIVATE KEY từ .env
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY chưa được cấu hình trong .env");
  process.exit(1);
}

// Convert private key thành account
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

let contract;
let contractAddress = null;

// Khởi tạo contract sau khi biết network ID
const initContract = async () => {
  if (!contractAddress) {
    const networkId = await web3.eth.net.getId();
    const networkInfo = VotingSystemJSON.networks[networkId];

    if (!networkInfo) {
      throw new Error(`Contract chưa deploy trên network ID ${networkId}`);
    }

    contractAddress = networkInfo.address;
    console.log("Contract Address:", contractAddress);
  }

  if (!contract) {
    contract = new web3.eth.Contract(contractABI, contractAddress);
  }
};

// ===================================================================
// ADD CANDIDATE
// ===================================================================
exports.addCandidateToBlockchain = async (name, party) => {
  await initContract();

  try {
    const tx = contract.methods.addCandidate(name, party);
    const gas = await tx.estimateGas({ from: account.address });

    const receipt = await tx.send({
      from: account.address,
      gas,
    });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("addCandidate error:", error);
    throw error;
  }
};

// ===================================================================
exports.verifyCandidateOnBlockchain = async (candidateId) => {
  await initContract();

  try {
    const tx = contract.methods.verifyCandidate(candidateId);
    const gas = await tx.estimateGas({ from: account.address });

    const receipt = await tx.send({
      from: account.address,
      gas,
    });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("verifyCandidate error:", error);
    throw error;
  }
};

// ===================================================================
exports.getAllCandidatesFromBlockchain = async () => {
  await initContract();

  try {
    const count = await contract.methods.getCandidateCount().call();
    const list = [];

    for (let i = 1; i <= count; i++) {
      const c = await contract.methods.getCandidate(i).call();

      list.push({
        id: i,
        name: c.name || c[0],
        party: c.party || c[1],
        voteCount: Number(c.voteCount || c[2]),
        isVerified: c.isVerified || c[3],
      });
    }

    return list;
  } catch (error) {
    console.error("getAllCandidates error:", error);
    throw error;
  }
};

// ===================================================================
exports.verifyCandidateOnBlockchain = async (candidateId) => {
  await initContract();

  try {
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await contract.methods.verifyCandidate(candidateId).estimateGas({ from: account.address });

    const tx = await contract.methods.verifyCandidate(candidateId).send({
      from: account.address,
      gas: gasEstimate,
      gasPrice: gasPrice
    });

    console.log("Candidate verified on blockchain:", tx.transactionHash);
    return true;
  } catch (error) {
    console.error("verifyCandidate error:", error);
    throw error;
  }
};

// ===================================================================
exports.getElectionResults = async () => {
  await initContract();

  try {
    const count = await contract.methods.getCandidateCount().call();
    const results = [];

    for (let i = 1; i <= count; i++) {
      const c = await contract.methods.getCandidate(i).call();

      results.push({
        id: i,
        name: c[0],
        party: c[1],
        voteCount: Number(c[2]),
      });
    }

    return results;
  } catch (error) {
    console.error("getElectionResults error:", error);
    throw error;
  }
};

// ===================================================================

// ===================================================================
// REGISTER VOTER
// ===================================================================
exports.registerVoterOnBlockchain = async (voterAddress) => {
  await initContract();

  try {
    const tx = contract.methods.registerVoter();
    const gas = await tx.estimateGas({ from: voterAddress });

    const receipt = await tx.send({
      from: voterAddress,
      gas,
    });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("registerVoter error:", error);
    throw error;
  }
};

// ===================================================================
// VERIFY VOTER
// ===================================================================
exports.verifyVoterOnBlockchain = async (voterAddress) => {
  await initContract();

  try {
    const tx = contract.methods.verifyVoter(voterAddress);
    const gas = await tx.estimateGas({ from: account.address });

    const receipt = await tx.send({
      from: account.address,
      gas,
    });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("verifyVoter error:", error);
    throw error;
  }
};

// ===================================================================
// VOTE
// ===================================================================
exports.voteOnBlockchain = async (candidateId, voterAddress) => {
  await initContract();

  try {
    const tx = contract.methods.vote(candidateId);
    const gas = await tx.estimateGas({ from: voterAddress });

    const receipt = await tx.send({
      from: voterAddress,
      gas,
    });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("vote error:", error);
    throw error;
  }
};

// ===================================================================
// CHANGE ELECTION STATE
// ===================================================================
exports.changeElectionStateOnBlockchain = async (newState) => {
  await initContract();

  const stateMap = {
    'Registration': 0,
    'Voting': 1,
    'Ended': 2
  };

  const stateValue = stateMap[newState];
  if (stateValue === undefined) {
    throw new Error('Invalid election state');
  }

  try {
    const tx = contract.methods.changeElectionState(stateValue);
    const gas = await tx.estimateGas({ from: account.address });

    const receipt = await tx.send({
      from: account.address,
      gas,
    });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("changeElectionState error:", error);
    throw error;
  }
};

// ===================================================================
// GET ELECTION STATE
// ===================================================================
exports.getElectionStateFromBlockchain = async () => {
  await initContract();

  try {
    const stateValue = await contract.methods.electionState().call();
    const stateNames = ['Registration', 'Voting', 'Ended'];
    return stateNames[stateValue] || 'Unknown';
  } catch (error) {
    console.error("getElectionState error:", error);
    throw error;
  }
};

// ===================================================================
// GET VOTER INFO
// ===================================================================
exports.getVoterInfoFromBlockchain = async (voterAddress) => {
  await initContract();

  try {
    const voter = await contract.methods.getVoter(voterAddress).call();
    return {
      isRegistered: voter.isRegistered || voter[0],
      isVerified: voter.isVerified || voter[1],
      hasVoted: voter.hasVoted || voter[2],
      votedCandidateId: Number(voter.votedCandidateId || voter[3])
    };
  } catch (error) {
    console.error("getVoterInfo error:", error);
    throw error;
  }
};
