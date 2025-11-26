// scripts/checkCounter.ts
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const RED_PACKET_ADDRESS = process.env.SEPOLIA_RED_PACKET_ADDRESS || "";

  console.log("SEPOLIA_RPC_URL =", process.env.SEPOLIA_RPC_URL);
  console.log("RED_PACKET_ADDRESS =", RED_PACKET_ADDRESS);

  if (!/^0x[0-9a-fA-F]{40}$/.test(RED_PACKET_ADDRESS)) {
    throw new Error(`RED_PACKET_ADDRESS 非法: ${RED_PACKET_ADDRESS}`);
  }

  // ⭐ 1. 先看这个地址上是否真的有合约代码
  const code = await ethers.provider.getCode(RED_PACKET_ADDRESS);
  console.log("on-chain code =", code);

  if (code === "0x") {
    throw new Error("这个地址在 Sepolia 上没有部署任何合约（getCode 返回 0x）");
  }

  // ⭐ 2. 确认有代码之后再去拿合约实例
  const rp = await ethers.getContractAt("RedPacket", RED_PACKET_ADDRESS);
  const counter = await rp.packetCounter();
  console.log("packetCounter on sepolia =", counter.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});