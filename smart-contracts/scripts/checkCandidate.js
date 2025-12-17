const VotingSystem = artifacts.require("VotingSystem");

module.exports = async function(callback) {
  try {
    const voting = await VotingSystem.deployed();

    console.log("🔍 Kiểm tra candidateId=8 trên blockchain...");

    // Lấy candidateCount
    const candidateCount = await voting.candidateCount();
    console.log("📊 Candidate Count:", candidateCount.toString());

    // Kiểm tra candidateId=8 có hợp lệ không
    if (8 > candidateCount) {
      console.log("❌ candidateId=8 > candidateCount, không hợp lệ!");
      return callback();
    }

    // Lấy thông tin candidate
    const candidate = await voting.getCandidate(8);
    console.log("✅ Candidate ID 8:");
    console.log("   - ID:", candidate[0].toString());
    console.log("   - Name:", candidate[1]);
    console.log("   - Party:", candidate[2]);
    console.log("   - Vote Count:", candidate[3].toString());
    console.log("   - Is Verified:", candidate[4]);

    if (candidate[4]) {
      console.log("✅ Candidate hợp lệ và đã verify!");
    } else {
      console.log("⚠️ Candidate chưa verify!");
    }

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }

  callback();
};