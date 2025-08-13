require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    educhain: {
      url: "https://rpc.open-campus-codex.gelato.digital",
      chainId: 656476,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei (very low for EduChain)
    }
  },
  etherscan: {
    apiKey: {
      educhain: "dummy" // EduChain doesn't require API key
    },
    customChains: [
      {
        network: "educhain",
        chainId: 656476,
        urls: {
          apiURL: "https://opencampus-codex.blockscout.com/api",
          browserURL: "https://opencampus-codex.blockscout.com"
        }
      }
    ]
  }
};
