import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import { mainnetRpcUrl } from './contract'

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(mainnetRpcUrl),
})
