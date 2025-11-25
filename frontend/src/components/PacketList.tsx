import { useEffect, useState } from 'react'
import { BaseError, formatEther } from 'viem'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import type { PacketInfo } from '../hooks/usePackets'
import { redPacketAbi, redPacketAddress } from '../lib/contract'

interface PacketListProps {
  packets: PacketInfo[]
  isLoading: boolean
  onActionComplete?: () => void
}

type PendingAction = 'claim' | 'recover' | null

export const PacketList = ({ packets, isLoading, onActionComplete }: PacketListProps) => {
  const { address } = useAccount()
  const [busyPacket, setBusyPacket] = useState<bigint | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [message, setMessage] = useState('')

  const { writeContractAsync, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  })

  useEffect(() => {
    if (isSuccess) {
      setMessage('操作已在链上确认。')
      setBusyPacket(null)
      setPendingAction(null)
      setTxHash(undefined)
      onActionComplete?.()
    }
  }, [isSuccess, onActionComplete])

  useEffect(() => {
    if (error) {
      setMessage(extractMessage(error))
    }
  }, [error])

  const handleActionError = (err: unknown) => {
    const friendly = extractMessage(err)
    if (friendly?.includes('already claimed')) {
      setMessage('你已经抢过这个红包啦，机会留给别人~')
    } else if (friendly?.includes('All slots are filled')) {
      setMessage('红包已经被抢完啦，下次手快一点~')
    } else if (friendly?.includes('expired')) {
      setMessage('红包已过期或已被回收。')
    } else if (friendly?.includes('Only the sender can recover')) {
      setMessage('只有发红包的人才能回收剩余金额。')
    } else {
      setMessage(friendly)
    }
  }

  const extractMessage = (error: unknown) => {
    if (!error) return ''
    if (error instanceof BaseError) {
      return error.shortMessage ?? error.message
    }
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }

  const handleClaim = async (packetId: bigint) => {
    try {
      setBusyPacket(packetId)
      setPendingAction('claim')
      const tx = await writeContractAsync({
        address: redPacketAddress,
        abi: redPacketAbi,
        functionName: 'claimRedPacket',
        args: [packetId],
      })
      setTxHash(tx)
      setMessage('抢红包交易已提交，等待确认...')
    } catch (err) {
      setBusyPacket(null)
      setPendingAction(null)
      handleActionError(err)
    }
  }

  const handleRecover = async (packetId: bigint) => {
    try {
      setBusyPacket(packetId)
      setPendingAction('recover')
      const tx = await writeContractAsync({
        address: redPacketAddress,
        abi: redPacketAbi,
        functionName: 'recoverRemaining',
        args: [packetId],
      })
      setTxHash(tx)
      setMessage('回收红包交易已提交...')
    } catch (err) {
      setBusyPacket(null)
      setPendingAction(null)
      handleActionError(err)
    }
  }

  if (isLoading) {
    return (
      <section className="card">
        <h2>红包列表</h2>
        <p>读取链上红包数据中...</p>
      </section>
    )
  }

  if (packets.length === 0) {
    return (
      <section className="card">
        <h2>红包列表</h2>
        <p className="muted">暂时还没有红包，成为第一个发红包的人吧！</p>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>红包列表</h2>
        <span className="count">{packets.length}</span>
      </div>
      <div className="packet-list">
        {packets.map((packet) => {
          const isOwner = address && address.toLowerCase() === packet.sender.toLowerCase()
          const remainingSlots = packet.totalParticipants - packet.claimedCount
          const canClaim = Boolean(
            address && packet.isRecoverable && remainingSlots > 0n && !packet.hasClaimed,
          )
          const canRecover = Boolean(isOwner && packet.isRecoverable && remainingSlots > 0n)
          const friendlyShares =
            remainingSlots > 0n ? `${remainingSlots.toString()} 份未领` : '已经被抢完啦'
          const isExpired =
            packet.endTime > 0n && Number(packet.endTime) * 1000 < Date.now()
          const endTimeLabel =
            packet.endTime > 0n
              ? new Date(Number(packet.endTime) * 1000).toLocaleString()
              : '不限时'

          return (
            <article key={packet.id.toString()} className="packet-item">
              <header>
                <div>
                  <p className="muted">红包 #{packet.id.toString()}</p>
                  <p className="address">{packet.sender}</p>
                </div>
                <strong>{formatEther(packet.totalAmount)} ETH</strong>
              </header>
              <p className="muted">{friendlyShares}</p>
              <p className="muted">截止：{endTimeLabel}</p>
              {!packet.isRecoverable && <p className="muted">红包已结束或被回收。</p>}
              {isExpired && <p className="muted">红包已过期。</p>}
              {packet.hasClaimed && <p className="info">你已经领取过这个红包了。</p>}

              <div className="card-actions">
                <button
                  type="button"
                  onClick={() => handleClaim(packet.id)}
                  disabled={!canClaim || busyPacket === packet.id || isConfirming}
                >
                  {busyPacket === packet.id && pendingAction === 'claim'
                    ? '领取中...'
                    : '抢红包'}
                </button>
                {isOwner && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => handleRecover(packet.id)}
                    disabled={!canRecover || busyPacket === packet.id || isConfirming}
                  >
                    {busyPacket === packet.id && pendingAction === 'recover'
                      ? '回收中...'
                      : '回收'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
      {message && <p className="muted">{message}</p>}
    </section>
  )
}
