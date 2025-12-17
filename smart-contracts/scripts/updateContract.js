const fs = require('fs');
const path = require('path');

// Đường dẫn nguồn (smart-contracts/build/contracts/VotingSystem.json)
const sourcePath = path.join(__dirname, '..', 'build', 'contracts', 'VotingSystem.json');

// Đường dẫn đích (client/src/contracts/VotingSystem.json)
const destPath = path.join(__dirname, '..', '..', 'client', 'src', 'contracts', 'VotingSystem.json');

// Hàm sao chép file
function updateContract() {
  try {
    // Kiểm tra file nguồn tồn tại
    if (!fs.existsSync(sourcePath)) {
      console.error('File nguồn không tồn tại:', sourcePath);
      return;
    }

    // Sao chép file
    fs.copyFileSync(sourcePath, destPath);
    console.log('Đã cập nhật VotingSystem.json trong client/src/contracts/');
  } catch (error) {
    console.error('Lỗi khi cập nhật contract:', error);
  }
}

// Chạy script
updateContract();