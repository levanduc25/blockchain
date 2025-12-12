const VotingSystem = artifacts.require("VotingSystem");
const fs = require("fs");
const path = require("path");

module.exports = async function (callback) {
  try {
    const instance = await VotingSystem.deployed();
    const accounts = await web3.eth.getAccounts();
    const networkId = await web3.eth.net.getId();

    const contractInfo = {
      contractAddress: instance.address,
      adminAddress: accounts[0],
      network: "development",
      networkId: networkId.toString(),
      ganacheUrl: "http://localhost:7545",
      deployedAt: new Date().toISOString(),
    };

    // Lưu vào thư mục gốc project
    const infoPath = path.join(__dirname, "../contract-info.json");
    fs.writeFileSync(infoPath, JSON.stringify(contractInfo, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("✅ CONTRACT INFORMATION");
    console.log("=".repeat(60));
    console.log(`📍 Contract Address: ${contractInfo.contractAddress}`);
    console.log(`👤 Admin Address:    ${contractInfo.adminAddress}`);
    console.log(`🌐 Network ID:       ${contractInfo.networkId}`);
    console.log(`📁 Saved to:         ${infoPath}`);
    console.log("=".repeat(60));

    console.log("\n📋 Copy these to your .env file:");
    console.log("=".repeat(60));
    console.log(`CONTRACT_ADDRESS=${contractInfo.contractAddress}`);
    console.log(`ADMIN_ADDRESS=${contractInfo.adminAddress}`);
    console.log(`RPC_URL=${contractInfo.ganacheUrl}`);
    console.log("=".repeat(60) + "\n");

    // Tạo file .env template
    const envTemplate = `# Blockchain
RPC_URL=${contractInfo.ganacheUrl}
CONTRACT_ADDRESS=${contractInfo.contractAddress}
ADMIN_ADDRESS=${contractInfo.adminAddress}
ADMIN_PRIVATE_KEY=your_admin_private_key_from_ganache_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/voting_system

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
`;

    const envPath = path.join(__dirname, "../backend/.env.example");
    fs.writeFileSync(envPath, envTemplate);
    console.log(`✅ .env.example template created at: ${envPath}\n`);

    callback();
  } catch (error) {
    console.error("❌ Error:", error);
    callback(error);
  }
};
