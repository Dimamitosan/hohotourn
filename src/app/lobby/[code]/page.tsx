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
    socket.on('cancelStart', () => {
      setTimerStarted(false)
      setTimer(5)
    })
  })

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

      socket.on('setLeader', (leader: boolean) => {
        setLobbyLeader(leader)
      })

      socket.on('updatePlayers', handleUpdatePlayers)

      socket.on('startGame', () => {
        setIsGameStarted(true)

        router.push(`/game/${code}`)
      })

      return () => {
        socket.off('startGame')
        socket.off('setLeader')
        socket.off('updateLobbyInfo')
        socket.off('updatePlayers', handleUpdatePlayers)
      }
    }
  }, [socket, code])

  useEffect(() => {
    socket.on('timerUpdate', (newTime: number) => {
      setTimer(newTime)
      if (newTime === 0) {
        socket.emit('setNumbers', code)
        socket.emit('startGame', code)
      }
    })

    // Убираем слушателя при размонтировании компонента
    return () => {
      socket.off('timerUpdate')
    }
  }, [])

  const handleStartGame = () => {
    if (!timerStarted) {
      setTimerStarted(true)
      socket.emit('startTimer', code)
    } else {
      socket.emit('toggleStart', code)
    }
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
      {lobbyLeader && !isGameStarted && (
        <button onClick={handleStartGame}>
          {timerStarted ? 'Отмена' : 'Начать игру'}
        </button>
      )}

      <h2>Осталось времени: {timer}</h2>
    </div>
  )
}

export default Lobby
