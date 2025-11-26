# 红包前端

基于 Vite + React + Wagmi 的链上红包前端，可以连接本地链或其他兼容 EVM 的网络来发红包、抢红包与回收剩余资金。

## 快速开始

1. 安装依赖（如果尚未安装）：

   ```bash
   npm install
   ```

2. 复制并填写环境变量，设置合约地址与 RPC（如果需要解析 ENS，可额外配置主网 RPC）：

   ```bash
   cp .env.example .env
   # 根据自己的部署结果修改下列变量
   # VITE_RED_PACKET_ADDRESS=0x...
   # VITE_RPC_URL=http://127.0.0.1:8545
   # VITE_CHAIN_ID=31337
   # VITE_MAINNET_RPC_URL=https://rpc.ankr.com/eth
   ```

3. 启动本地开发服务器：

   ```bash
   npm run dev
   ```

打开 <http://localhost:5173>，使用注入式钱包（MetaMask、Rabbi 等）连接指定网络即可开始体验。

## 功能说明

- 顶部钱包栏可连接、断开或切换不同钱包，并提示网络是否匹配。
- 「发红包」表单支持输入 ETH 总额与份数，提交后会调用 `createPacket` 并在交易确认后自动刷新列表。
- 红包列表会展示链上所有红包，含剩余份数、余额以及自己是否已领取。
- 当用户尚未领取且红包仍激活时可以点击「抢红包」，若已经抢完或自己抢过则会提示友好信息。
- 对于仍有余额的自建红包，会显示「回收」按钮，方便在红包结束前收回剩余资金。

## 主要技术栈

- [Vite](https://vite.dev/) + React 19 + TypeScript
- [Wagmi v3](https://wagmi.sh/) + [Viem](https://viem.sh/) 负责链上交互
- [@tanstack/react-query](https://tanstack.com/query/latest) 管理合约读取的缓存与刷新

根据需要可自行扩展样式、钱包连接方式或部署到生产环境。
