module.exports = {
  networks: {
    // Ganache development network
    development: {
      host: "127.0.0.1",       // Localhost
      port: 7545,             // Ganache default port (hoặc 8545 nếu dùng Ganache CLI)
      network_id: "*",        // Match any network id
      gas: 6721975,           // Gas limit
      gasPrice: 20000000000   // 20 gwei
    },
    
    // Ganache CLI network (nếu bạn dùng ganache-cli)
    ganache_cli: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.19",      // Fetch exact version from solc-bin
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  // Hooks to run after compilation
  hooks: {
    'postCompile': 'node ./scripts/updateContract.js'
  },

  // Truffle DB is currently disabled by default
  db: {
    enabled: false
  }
};