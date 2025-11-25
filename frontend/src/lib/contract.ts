import type { Abi } from 'viem'

const redPacketAddressFromEnv = (import.meta.env.VITE_RED_PACKET_ADDRESS ?? '').trim()
const fallbackAddress = '0x0000000000000000000000000000000000000000'

export const isContractConfigured = Boolean(redPacketAddressFromEnv)
export const redPacketAddress = (redPacketAddressFromEnv || fallbackAddress) as `0x${string}`

export const preferredChainId = Number(import.meta.env.VITE_CHAIN_ID ?? 31337)
export const rpcUrl = import.meta.env.VITE_RPC_URL ?? 'http://127.0.0.1:8545'

export const redPacketAbi = [
  {
    type: 'event',
    name: 'RedPacketCreated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'totalParticipants', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'endTime', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RedPacketClaimed',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'claimer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RedPacketRecovered',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'remainingAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'function',
    name: 'createRedPacket',
    stateMutability: 'payable',
    inputs: [
      { name: 'totalParticipants', internalType: 'uint256', type: 'uint256' },
      { name: 'endTime', internalType: 'uint256', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimRedPacket',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'recoverRemaining',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getPacketInfo',
    stateMutability: 'view',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    outputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'totalAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'totalParticipants', internalType: 'uint256', type: 'uint256' },
      { name: 'claimedCount', internalType: 'uint256', type: 'uint256' },
      { name: 'isRecoverable', internalType: 'bool', type: 'bool' },
      { name: 'endTime', internalType: 'uint256', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'hasUserClaimed',
    stateMutability: 'view',
    inputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'user', internalType: 'address', type: 'address' },
    ],
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getClaimRecords',
    stateMutability: 'view',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    outputs: [
      {
        name: '',
        internalType: 'struct RedPacket.ClaimRecord[]',
        type: 'tuple[]',
        components: [
          { name: 'claimer', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'packetCounter',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
] as const satisfies Abi
