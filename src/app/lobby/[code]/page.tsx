'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'
import style from '../style.module.css'

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

  const quit = () => {
    router.push(`/`)
    socket.emit('quitFromLobby', code)
  }

  return (
    <div className={style.content}>
      <b className={style.code}>Код лобби: {code}</b>
      <b className={style.countOfPlayers}>
        Игроков: {players.length}/{maxPlayers}
      </b>
      <h2 className={timerStarted ? style.timer : style.noneTimer}>{timer}</h2>
      <div className={style.playersList}>
        <h2 className={style.players}>Игроки:</h2>
        <ol className={style.playerRow}>
          {players.map((player) => (
            <li key={player}>{player}</li>
          ))}
        </ol>
      </div>
      <div className={style.buttons}>
        {lobbyLeader && !isGameStarted ? (
          <button className={style.button} onClick={handleStartGame}>
            <b> {timerStarted ? 'Отмена' : 'Начать игру'}</b>
          </button>
        ) : (
          <button className={style.button}>
            <b>Готов</b>
          </button>
        )}
        <button className={style.button} onClick={quit}>
          <b> Выйти</b>
        </button>
      </div>
    </div>
  )
}

export default Lobby
