import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// 从 artifacts 里读取编译后的 ABI 和 bytecode
const artifact = JSON.parse(
  fs.readFileSync("./artifacts/contracts/RedPacket.sol/RedPacket.json", "utf8")
);
const abi = artifact.abi;
const bytecode = artifact.bytecode;

async function main() {
  const network = process.argv[2] || "localhost"; // 默认本地链

  let rpcUrl;
  let privateKey;

  if (network === "localhost") {
    // 本地 Hardhat 节点
    rpcUrl = "http://127.0.0.1:8545";
    // 用 Hardhat node 提供的第一个私钥（下面会告诉你去哪儿拿）
    privateKey = process.env.LOCAL_PRIVATE_KEY;
  } else if (network === "sepolia") {
    rpcUrl = process.env.SEPOLIA_RPC_URL;
    privateKey = process.env.PRIVATE_KEY;
  } else {
    throw new Error(`Unknown network: ${network}`);
  }

  if (!rpcUrl) throw new Error("Missing RPC URL");
  if (!privateKey || privateKey.length !== 66 || !privateKey.startsWith("0x")) {
    throw new Error("Invalid private key");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with address:", await wallet.getAddress());
  console.log("Network:", network);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log("Deploy tx hash:", contract.deploymentTransaction().hash);
  await contract.waitForDeployment();

  console.log("RedPacket deployed to:", await contract.getAddress());
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});