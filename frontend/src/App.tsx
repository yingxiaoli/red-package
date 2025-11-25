import { useAccount } from 'wagmi'

import './App.css'
import { CreatePacketForm } from './components/CreatePacketForm'
import { PacketList } from './components/PacketList'
import { WalletControls } from './components/WalletControls'
import { usePackets } from './hooks/usePackets'

function App() {
  const { address } = useAccount()
  const { packets, isLoading, refresh } = usePackets(address)

  return (
    <div className="app-shell">
      <WalletControls />
      <main>
        <CreatePacketForm onCreated={refresh} />
        <PacketList packets={packets} isLoading={isLoading} onActionComplete={refresh} />
      </main>
    </div>
  )
}

export default App
