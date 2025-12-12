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
