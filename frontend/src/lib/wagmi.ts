import { QueryClient } from '@tanstack/react-query'
import { defineChain, http } from 'viem'
import { createConfig } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { hardhat } from 'wagmi/chains'

import { preferredChainId, rpcUrl } from './contract'

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

export const wagmiConfig = createConfig({
  chains: [appChain],
  connectors: [metaMask()],
  ssr: false,
  transports: {
    [appChain.id]: http(rpcUrl),
  },
})

export const queryClient = new QueryClient()

export type SupportedChain = typeof appChain
