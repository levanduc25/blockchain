const VotingSystem = artifacts.require("VotingSystem");
const fs = require('fs');
const path = require('path');

module.exports = function(deployer, network, accounts) {
  // Deploy contract
  deployer.deploy(VotingSystem).then(async (instance) => {
    console.log("\n=================================");
    console.log("VotingSystem Contract Deployed!");
    console.log("=================================");
    console.log("Contract Address:", instance.address);
    console.log("Admin Address:", accounts[0]);
    console.log("Network:", network);
    console.log("=================================\n");

    // Lưu thông tin contract vào file JSON
    const contractInfo = {
      contractAddress: instance.address,
      adminAddress: accounts[0],
      network: network,
      deployedAt: new Date().toISOString(),
      networkId: await web3.eth.net.getId()
    };

    // Đường dẫn lưu file
    const infoPath = path.join(__dirname, '../contract-info.json');
    
    // Ghi file
    fs.writeFileSync(
      infoPath,
      JSON.stringify(contractInfo, null, 2)
    );

    console.log("Contract info saved to:", infoPath);
    console.log("\n");
  });
};