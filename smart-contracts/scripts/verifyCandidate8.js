const VotingSystem = artifacts.require("VotingSystem");

module.exports = async function(callback) {
  try {
    const voting = await VotingSystem.deployed();
    const accounts = await web3.eth.getAccounts();

    console.log("🔧 Verify candidate ID 8 trên blockchain...");

    // Verify candidate 8
    await voting.verifyCandidate(8, { from: accounts[0] });

    console.log("✅ Đã verify candidate ID 8 trên blockchain!");

    // Kiểm tra lại
    const candidate = await voting.getCandidate(8);
    console.log("🔍 Kiểm tra lại:");
    console.log("   - Is Verified:", candidate[4]);

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }

  callback();
};