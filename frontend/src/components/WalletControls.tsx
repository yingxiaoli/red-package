import { useMemo } from 'react'
import { BaseError } from 'viem'
import type { Connector } from 'wagmi'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'

import { appChain } from '../lib/wagmi'

const formatAddress = (value?: `0x${string}`) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : ''

export const WalletControls = () => {
  const { address, connector: activeConnector, status: accountStatus, chainId } = useAccount()
  const { connectors, connectAsync, status: connectStatus, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain()

  const hasConnectors = useMemo(() => connectors.length > 0, [connectors])
  const isWrongNetwork = Boolean(chainId && chainId !== appChain.id)
  const isBusy = connectStatus === 'pending' || isSwitching

  const handleConnect = async (connector: Connector) => {
    await connectAsync({ connector, chainId: appChain.id })
  }

  const handleSwitchNetwork = () => {
    switchChain({ chainId: appChain.id })
  }

  return (
    <header className="wallet-bar">
      <div>
        <p className="eyebrow">Red Packet</p>
        <h1>链上红包广场</h1>
        <p className="muted">
          连接钱包后可以发红包、抢红包，或者回收尚未被领取的剩余 ETH。
        </p>
      </div>

      <div className="wallet-actions">
        {address ? (
          <div className="wallet-status">
            <span className="pill success">已连接</span>
            <span className="address">{formatAddress(address)}</span>
          </div>
        ) : (
          <span className="pill">未连接</span>
        )}

        <div className="connector-buttons">
          {hasConnectors ? (
            connectors.map((connector) => (
              <div key={connector.id} className="connector-entry">
                <button
                  type="button"
                  onClick={() => handleConnect(connector)}
                  disabled={isBusy || connector.id === activeConnector?.id}
                >
                  {accountStatus === 'connected' ? `切换到 ${connector.name}` : connector.name}
                </button>
                {!connector.ready && (
                  <p className="muted tiny">
                    尚未检测到 {connector.name}，请确认扩展已解锁后再尝试连接。
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="muted">尚未检测到可用的钱包扩展，请先安装 MetaMask 等注入式钱包。</p>
          )}
          {address && (
            <button type="button" className="ghost" onClick={() => disconnect()}>
              断开
            </button>
          )}
        </div>

        {isWrongNetwork && (
          <div className="warning">
            <p>当前网络不正确，请切换到本地链 ({appChain.name}).</p>
            <button type="button" onClick={handleSwitchNetwork} disabled={isBusy}>
              自动切换
            </button>
          </div>
        )}
        {error && <p className="error">连接失败：{extractMessage(error)}</p>}
        {switchError && <p className="error">切换网络失败：{extractMessage(switchError)}</p>}
      </div>
    </header>
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
