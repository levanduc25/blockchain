const VotingSystem = artifacts.require("VotingSystem");

module.exports = async function(callback) {
  try {
    // Lấy deployed contract instance
    const voting = await VotingSystem.deployed();
    const accounts = await web3.eth.getAccounts();
    
    console.log("\n🔍 Contract Address:", voting.address);
    console.log("👤 Admin:", accounts[0]);
    console.log("\n" + "=".repeat(50));

    // 1. Admin thêm ứng viên
    console.log("\nBƯỚC 1: Admin thêm ứng viên...");
    await voting.addCandidate("Nguyễn Văn A", "Đảng Dân chủ", { from: accounts[0] });
    await voting.addCandidate("Trần Thị B", "Đảng Cộng hòa", { from: accounts[0] });
    console.log("Đã thêm 2 ứng viên");

    // 2. Admin xác thực ứng viên
    console.log("\nBƯỚC 2: Admin xác thực ứng viên...");
    await voting.verifyCandidate(1, { from: accounts[0] });
    await voting.verifyCandidate(2, { from: accounts[0] });
    console.log("Đã xác thực 2 ứng viên");

    // 3. Cử tri đăng ký
    console.log("\nBƯỚC 3: Cử tri đăng ký...");
    await voting.registerVoter({ from: accounts[1] });
    await voting.registerVoter({ from: accounts[2] });
    console.log("Đã đăng ký 2 cử tri");

    // 4. Admin xác thực cử tri
    console.log("\nBƯỚC 4: Admin xác thực cử tri...");
    await voting.verifyVoter(accounts[1], { from: accounts[0] });
    await voting.verifyVoter(accounts[2], { from: accounts[0] });
    console.log("Đã xác thực 2 cử tri");

    // 5. Chuyển sang trạng thái Voting
    console.log("\nBƯỚC 5: Bắt đầu bỏ phiếu...");
    await voting.changeElectionState(1, { from: accounts[0] }); // 1 = Voting
    console.log("Đã chuyển sang trạng thái VOTING");

    // 6. Cử tri bỏ phiếu
    console.log("\nBƯỚC 6: Cử tri bỏ phiếu...");
    await voting.vote(1, { from: accounts[1] }); // Vote cho ứng viên 1
    await voting.vote(2, { from: accounts[2] }); // Vote cho ứng viên 2
    console.log("Đã bỏ phiếu xong");

    // 7. Xem kết quả
    console.log("\nBƯỚC 7: Xem kết quả...");
    const candidates = await voting.getAllCandidates();
    console.log("\nKẾT QUẢ BỎ PHIẾU:");
    console.log("=".repeat(50));
    
    for (let i = 0; i < candidates.length; i++) {
      console.log(`
      ID: ${candidates[i].id}
      Tên: ${candidates[i].name}
      Đảng: ${candidates[i].party}
      Số phiếu: ${candidates[i].voteCount}
      Đã xác thực: ${candidates[i].isVerified}
      `);
    }

    const totalVotes = await voting.totalVotes();
    console.log(`📈 Tổng số phiếu: ${totalVotes}`);

    // 8. Kết thúc bỏ phiếu và công bố người thắng
    console.log("\nBƯỚC 8: Kết thúc bỏ phiếu...");
    await voting.changeElectionState(2, { from: accounts[0] }); // 2 = Ended
    console.log("Đã kết thúc bỏ phiếu");

    const winner = await voting.getWinner();
    console.log("\nNGƯỜI CHIẾN THẮNG:");
    console.log("=".repeat(50));
    console.log(`${winner.name} (${winner.party})`);
    console.log(`Số phiếu: ${winner.voteCount}`);
    console.log("=".repeat(50) + "\n");

    callback();
  } catch (error) {
    console.error("❌ Error:", error);
    callback(error);
  }
};