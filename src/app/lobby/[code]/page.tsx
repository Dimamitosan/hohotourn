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
  const [lobbyLeader, setLobbyLeader] = useState<boolean>(false)
  const [timer, setTimer] = useState<number>(5)
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false)
  const [maxPlayers, setMaxPlayers] = useState<number>(0)
  const [timerStarted, setTimerStarted] = useState<boolean>(false)

  useEffect(() => {
    if (code) {
      socket.emit('joinLobby', code)
      try {
        socket.on('updateLobbyInfo', (max: number) => {
          setMaxPlayers(max)
        })
      } catch (e) {}

      const handleUpdatePlayers = (newPlayers: string[]) => {
        setPlayers(newPlayers)
      }

      socket.on('findLobbyLeader', (leader: boolean) => {
        setLobbyLeader(leader)
      })

      socket.on('updatePlayers', handleUpdatePlayers)

      socket.on('startGame', () => {
        setIsGameStarted(true)

        router.push(`/game/${code}`)
      })

      return () => {
        socket.off('updatePlayers', handleUpdatePlayers)
      }
    }
  }, [socket, code])

  useEffect(() => {
    socket.on('timerUpdate', (newTime: number) => {
      setTimer(newTime)
      if (newTime === 0) {
        socket.emit('startGame', code)
      }
    })

    // Убираем слушателя при размонтировании компонента
    return () => {
      socket.off('timerUpdate')
      socket.off('startGame')
    }
  }, [])

  const handleStartGame = () => {
    setTimerStarted(true)
    socket.emit('startTimer', code)
  }

  return (
    <div>
      <h1>Лобби: {code}</h1>
      <h2>
        Игроков: {players.length}/{maxPlayers}
      </h2>
      <h2>Игроки:</h2>
      <ul>
        {players.map((player) => (
          <li key={player}>{player}</li>
        ))}
      </ul>
      {lobbyLeader && !isGameStarted && !timerStarted && (
        <button onClick={handleStartGame}>Начать игру</button>
      )}
      <h2>Осталось времени: {timer}</h2>
    </div>
  )
}

export default Lobby
