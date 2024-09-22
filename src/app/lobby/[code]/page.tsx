'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'

interface LobbyProps {
  params: any
}
const Lobby: React.FC<LobbyProps> = ({ params }) => {
  const socket = useSocket()
  const router = useRouter()

  const code = params.code

  const [players, setPlayers] = useState<string[]>([])

  useEffect(() => {
    if (code) {
      socket.emit('joinLobby', code)

      // Update players with the received list
      const handleUpdatePlayers = (newPlayers: string[]) => {
        setPlayers(newPlayers)
      }

      socket.on('updatePlayers', handleUpdatePlayers) // Listen for player updates

      return () => {
        socket.off('updatePlayers', handleUpdatePlayers) // Clean up on unmount
      }
    }
  }, [socket, code])

  return (
    <div>
      <h1>Лобби: {code}</h1>
      <h2>Игрокиq:</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
    </div>
  )
}

export default Lobby
