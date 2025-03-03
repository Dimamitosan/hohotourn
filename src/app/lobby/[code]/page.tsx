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
  const [timer, setTimer] = useState<number>(6)
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false)
  const [maxPlayers, setMaxPlayers] = useState<number>(0)
  const [timerStarted, setTimerStarted] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isButtonEnabled, setIsButtonEnabled] = useState(true)
  const [canLeave, setCanLeave] = useState<boolean>(true)
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [gemeExists, setGameExists] = useState<boolean>(true)

  useEffect(() => {
    if (code) {
      console.log(code)
      socket.emit('askGameExists', code)
    }
  }, [])

  useEffect(() => {
    socket.on('answerGameExists', (isExists: boolean) => {
      setGameExists(isExists)
      if (!isExists) {
        console.log('qwewqewq', isExists)
        setIsModalOpen(true)
      }
    })
  }, [socket, isModalOpen])

  useEffect(() => {
    socket.on('cancelStart', () => {
      setTimerStarted(false)
      setCanLeave(true)
      setTimer(5)
    })
    socket.on('timerStarted', () => {
      setCanLeave(false)
      setTimerStarted(true)
    })
    return () => {
      socket.off('cancelStart')
      socket.off('timerStarted')
    }
  }, [timerStarted, timer])

  useEffect(() => {
    ;(async () => {
      await setTimeout(() => {
        setLoadingData(false)
      }, 4000)
    })()
  })

  useEffect(() => {
    if (code) {
      socket.emit('joinLobby', code)
    }
  }, [])

  useEffect(() => {
    socket.on('disconnect', () => {
      router.push(`/`)
    })
  }, [socket])

  useEffect(() => {
    if (code) {
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
  }, [socket, code, isGameStarted])

  useEffect(() => {
    let timer: any
    if (!isButtonEnabled) {
      timer = setTimeout(() => {
        setIsButtonEnabled(true)
      }, 1000) // 1 секунда
    }

    // Очистка таймера при размонтировании компонента или перед повторным вызовом useEffect
    return () => clearTimeout(timer)
  }, [isButtonEnabled])

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
    setIsButtonEnabled(false)
    setTimer(5)
    if (!timerStarted) {
      setTimerStarted(true)

      socket.emit('startTimer', code)
    } else {
      setTimer(6)
      socket.emit('toggleStart', code)
    }
  }

  const quit = () => {
    router.push(`/`)
    socket.emit('quitFromLobby', code)
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  if (loadingData) {
    return (
      <div className={style.loading}>
        <p className={style.loading_text}>Создаем комнату</p>
        <div className={style.loading_dots}>
          <ul className={style.dots_row}>
            <li className={style.dot}></li>
            <li className={style.dot}></li>
            <li className={style.dot}> </li>

            <li className={style.dot}></li>
            <li className={style.dot}> </li>
          </ul>
        </div>
      </div>
    )
  }

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

      <Help
        isOpen={isModalOpen}
        onClose={closeModal}
        leave={!gemeExists}
      ></Help>

      <div className={style.playersList}>
        <h3 className={style.players}>Игроки:</h3>
        <ol className={style.playerRow}>
          {players.map((player) => (
            <li key={player}>{player}</li>
          ))}
        </ol>
      </div>

      <div className={style.buttons}>
        {lobbyLeader ? (
          canLeave ? (
            <button
              disabled={!isButtonEnabled}
              className={`${style.button} ${
                isButtonEnabled ? null : style.disabled
              }`}
              onClick={handleStartGame}
            >
              <p> Начать игру</p>
            </button>
          ) : (
            <button
              disabled={!isButtonEnabled}
              className={`${style.button} ${
                isButtonEnabled ? null : style.disabled
              }`}
              onClick={handleStartGame}
            >
              <p>Отмена</p>
            </button>
          )
        ) : null}

        {canLeave ? (
          <button className={style.button} onClick={quit}>
            <p>Выйти</p>
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default Lobby
