import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();
console.log(process.env.SEPOLIA_RPC_URL)
console.log(process.env.SEPOLIA_PRIVATE_KEY)
const config: HardhatUserConfig = {
  solidity: "0.8.24",
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // ⭐ V2 使用单个 key
  },
  networks: {
    // 本地链：npx hardhat node 起的那个
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};

export default config;
