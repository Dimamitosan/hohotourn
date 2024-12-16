'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'

import Help from '../modal/modal'

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
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    socket.on('cancelStart', () => {
      setTimerStarted(false)
      setTimer(5)
    })
    socket.on('timerStarted', () => {
      setTimerStarted(true)
    })
    return () => {
      socket.off('cancelStart')
      socket.off('timerStarted')
    }
  }, [timerStarted, timer])

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

    return () => {
      socket.off('timerUpdate')
    }
  }, [timerStarted, timer])

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

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div className={style.content}>
      <p className={style.code}>Код лобби: {code}</p>
      <p className={style.countOfPlayers}>
        Игроков: {players.length}/{maxPlayers}
      </p>
      {timerStarted ? (
        <p className={style.timer}>{timer}</p>
      ) : (
        <button className={style.rules} onClick={openModal}>
          Правила
        </button>
      )}

      <Help isOpen={isModalOpen} onClose={closeModal}></Help>

      <div className={style.playersList}>
        <h3 className={style.players}>Игроки:</h3>
        <ol className={style.playerRow}>
          {players.map((player) => (
            <li key={player}>{player}</li>
          ))}
        </ol>
      </div>
      <div className={style.buttons}>
        {lobbyLeader && !isGameStarted ? (
          <button className={style.button} onClick={handleStartGame}>
            <p> {timerStarted ? 'Отмена' : 'Начать игру'}</p>
          </button>
        ) : null}
        <button className={style.button} onClick={quit}>
          <p>Выйти</p>
        </button>
      </div>
    </div>
  )
}

export default Lobby
