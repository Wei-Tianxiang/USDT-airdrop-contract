require("@nomicfoundation/hardhat-toolbox");

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const MAINNET_PRIVATE_KEY = process.env.PRIV_KEY_2;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.5",
      },
      {
        version: "0.8.17",
        settings: {},
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        accounts: [MAINNET_PRIVATE_KEY],
        blockNumber: 16040713,
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
