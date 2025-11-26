// scripts/deploy.ts
import { ethers, network } from "hardhat";

async function main() {
  console.log(`\n🚀 Deploying RedPacket to network: ${network.name}...`);

  // 1. 取到合约工厂（名字要和 .sol 里的合约名一致）
  const RedPacket = await ethers.getContractFactory("RedPacket");

  // 2. 部署（这个合约没有构造参数）
  const redPacket = await RedPacket.deploy();

  // 3. 等待上链
  await redPacket.waitForDeployment();

  const address = await redPacket.getAddress();
  const deployer = await redPacket.runner?.getAddress();

  console.log("====================================");
  console.log(`Deployer:   ${deployer}`);
  console.log(`Network:    ${network.name}`);
  console.log(`RedPacket:  ${address}`);
  console.log("====================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});