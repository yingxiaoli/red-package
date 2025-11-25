import { useCallback, useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'

import { isContractConfigured, redPacketAbi, redPacketAddress } from '../lib/contract'

export interface PacketInfo {
  id: bigint
  sender: `0x${string}`
  totalAmount: bigint
  totalParticipants: bigint
  claimedCount: bigint
  isRecoverable: boolean
  endTime: bigint
  hasClaimed: boolean
}

export const usePackets = (account?: `0x${string}`) => {
  const {
    data: totalPacketCount,
    isPending: isCounting,
    refetch: refetchCounter,
  } = useReadContract({
    address: redPacketAddress,
    abi: redPacketAbi,
    functionName: 'packetCounter',
    query: {
      enabled: isContractConfigured,
    },
  })

  const packetIds = useMemo(() => {
    if (!totalPacketCount || totalPacketCount === 0n) {
      return []
    }
    const total = Number(totalPacketCount)
    return Array.from({ length: total }, (_, index) => BigInt(index))
  }, [totalPacketCount])

  const {
    data: packetData,
    isPending: isReadingPackets,
    refetch: refetchPackets,
  } = useReadContracts({
    contracts: packetIds.map((id) => ({
      address: redPacketAddress,
      abi: redPacketAbi,
      functionName: 'getPacketInfo',
      args: [id],
    })),
    query: {
      enabled: isContractConfigured && packetIds.length > 0,
    },
  })

  const {
    data: claimedData,
    refetch: refetchClaimed,
  } = useReadContracts({
    contracts:
      account && packetIds.length > 0
        ? packetIds.map((id) => ({
            address: redPacketAddress,
            abi: redPacketAbi,
            functionName: 'hasUserClaimed',
            args: [id, account],
          }))
        : [],
    query: {
      enabled: Boolean(account) && packetIds.length > 0,
    },
  })

  const packets: PacketInfo[] = useMemo(() => {
    if (!packetData) {
      return []
    }

    return packetData
      .map((entry, index) => {
        if (entry.status !== 'success' || entry.result === undefined) {
          return null
        }
        const [sender, totalAmount, totalParticipants, claimedCount, isRecoverable, endTime] =
          entry.result as unknown as [
            `0x${string}`,
            bigint,
            bigint,
            bigint,
            boolean,
            bigint,
          ]

        if (sender === '0x0000000000000000000000000000000000000000') {
          return null
        }

        const claimedEntry = claimedData?.[index]
        const claimedResult = claimedEntry?.result as boolean | undefined
        const hasClaimed = claimedEntry?.status === 'success' && claimedResult === true

        return {
          id: packetIds[index],
          sender,
          totalAmount,
          totalParticipants,
          claimedCount,
          isRecoverable,
          endTime,
          hasClaimed: Boolean(hasClaimed),
        }
      })
      .filter((packet): packet is PacketInfo => Boolean(packet))
      .sort((a, b) => Number(b.id - a.id))
  }, [packetData, claimedData, packetIds])

  const refresh = useCallback(() => {
    void refetchCounter()
    void refetchPackets()
    if (refetchClaimed) {
      void refetchClaimed()
    }
  }, [refetchClaimed, refetchCounter, refetchPackets])

  return {
    packets,
    isLoading: isCounting || isReadingPackets,
    refresh,
  }
}
