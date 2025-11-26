import { QueryClient } from '@tanstack/react-query'
import { defineChain, http } from 'viem'
import type { Chain } from 'viem/chains'
import { createConfig } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { hardhat, mainnet } from 'wagmi/chains'

import { mainnetRpcUrl, preferredChainId, rpcUrl } from './contract'

export const appChain =
  preferredChainId === hardhat.id
    ? {
        ...hardhat,
        rpcUrls: {
          ...hardhat.rpcUrls,
          default: { http: [rpcUrl] },
          public: { http: [rpcUrl] },
        },
      }
    : defineChain({
        id: preferredChainId,
        name: 'Red Packet Chain',
        network: 'red-packet-local',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: [rpcUrl] },
          public: { http: [rpcUrl] },
        },
      })

const chains: [typeof appChain, ...Chain[]] =
  appChain.id === mainnet.id ? [appChain] : [appChain, mainnet]

const transports: Record<number, ReturnType<typeof http>> = {
  [appChain.id]: http(rpcUrl),
}

if (appChain.id !== mainnet.id) {
  transports[mainnet.id] = http(mainnetRpcUrl)
}

export const wagmiConfig = createConfig({
  chains,
  connectors: [metaMask()],
  ssr: false,
  transports,
})

export const queryClient = new QueryClient()

export type SupportedChain = typeof appChain
