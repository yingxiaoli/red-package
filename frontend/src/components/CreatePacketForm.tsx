import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { BaseError, parseEther } from 'viem'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { isContractConfigured, redPacketAbi, redPacketAddress } from '../lib/contract'

interface CreatePacketFormProps {
  onCreated?: () => void
}

export const CreatePacketForm = ({ onCreated }: CreatePacketFormProps) => {
  const { status: accountStatus } = useAccount()
  const [amount, setAmount] = useState('')
  const [participants, setParticipants] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContractAsync, isPending, error } = useWriteContract()
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmationError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  })

  useEffect(() => {
    if (isConfirmed) {
      setAmount('')
      setParticipants('')
      setDurationMinutes('')
      setStatusMessage('红包创建成功，等待区块确认完成。')
      setTxHash(undefined)
      onCreated?.()
    }
  }, [isConfirmed, onCreated])

  useEffect(() => {
    if (error) {
      setStatusMessage(extractMessage(error))
    } else if (confirmationError) {
      setStatusMessage(extractMessage(confirmationError))
    }
  }, [confirmationError, error])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isContractConfigured) {
      setStatusMessage('请先在 .env 文件中配置合约地址。')
      return
    }
    if (!amount || !participants) {
      setStatusMessage('请填写红包总金额和份数。')
      return
    }
    const totalParticipants = BigInt(participants)
    if (totalParticipants <= 0n) {
      setStatusMessage('份数必须大于 0。')
      return
    }

    const parsedDuration = Number(durationMinutes)
    const nowSeconds = Math.floor(Date.now() / 1000)
    const endTime =
      !Number.isNaN(parsedDuration) && parsedDuration > 0
        ? BigInt(nowSeconds + parsedDuration * 60)
        : 0n

    try {
      const tx = await writeContractAsync({
        address: redPacketAddress,
        abi: redPacketAbi,
        functionName: 'createRedPacket',
        args: [totalParticipants, endTime],
        value: parseEther(amount),
      })
      setTxHash(tx)
      setStatusMessage('交易已提交，等待链上确认...')
    } catch (submissionError) {
      setStatusMessage(extractMessage(submissionError))
    }
  }

  const isDisabled =
    accountStatus !== 'connected' || isPending || isConfirming || !isContractConfigured

  return (
    <section className="card">
      <h2>发红包</h2>
      <p className="muted">输入红包金额、份数与可选的过期时间，使用平均拆分的方式发放。</p>
      <form className="packet-form" onSubmit={handleSubmit}>
        <label>
          红包总额 (ETH)
          <input
            type="number"
            min="0"
            step="0.0001"
            placeholder="0.1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          份数
          <input
            type="number"
            min="1"
            step="1"
            placeholder="5"
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
          />
        </label>
        <label>
          过期时间（分钟，可选，0 表示无）
          <input
            type="number"
            min="0"
            step="1"
            placeholder="30"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
          />
        </label>
        <button type="submit" disabled={isDisabled}>
          {isPending || isConfirming ? '提交中...' : '发红包'}
        </button>
      </form>
      {statusMessage && <p className="muted">{statusMessage}</p>}
      {!isContractConfigured && (
        <p className="error">未配置 VITE_RED_PACKET_ADDRESS，无法发送红包。</p>
      )}
    </section>
  )
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
