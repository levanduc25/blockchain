const VotingSystem = artifacts.require("VotingSystem");

module.exports = async function(callback) {
  try {
    const voting = await VotingSystem.deployed();
    const accounts = await web3.eth.getAccounts();

    console.log("🔍 Kiểm tra trạng thái election...");

    const state = await voting.electionState();
    console.log("Election State:", state.toString()); // 0=Registration, 1=Voting, 2=Ended

    if (state.toString() === "0") {
      console.log("🔄 Chuyển sang Voting...");
      await voting.changeElectionState(1, { from: accounts[0] });
      console.log("✅ Đã chuyển sang Voting!");
    } else if (state.toString() === "1") {
      console.log("✅ Đã ở trạng thái Voting!");
    } else {
      console.log("⚠️ Election đã Ended!");
    }

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }

  callback();
};