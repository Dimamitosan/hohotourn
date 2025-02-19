'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'
import Scores from '../phases/scores'
import WriteQuestions from '../phases/writeQuestions'
import AnswerOnQuestions from '../phases/answerOnQuestions'
import VoteForAnswer from '../phases/voteForAnswer'

import style from '../styles/page.module.css'

interface LobbyProps {
  params: any
}

interface Popup {
  id: number
  message: string
}

interface PopupProps {
  message: string
  onRemove: () => void
}

const Popup: React.FC<PopupProps> = ({ message, onRemove }) => {
  return (
    <div className={style.popup} onAnimationEnd={onRemove}>
      {message}
    </div>
  )
}

const Game: React.FC<LobbyProps> = ({ params }) => {
  const [lobbyLeader, setLobbyLeader] = useState<boolean>(false)
  const [isLeaderSet, setIsLeaderSet] = useState<boolean>(false)
  const [seconds, setSeconds] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<number>(1)
  const [isGameEnded, setIsGameEnded] = useState<boolean>(false)
  const [prevPhase, setPrevPhase] = useState<number>(0)
  const [isGameStarted, setIsGameStarted] = useState<boolean>(true)
  const [popups, setPopups] = useState<Popup[]>([])

  const socket = useSocket()
  const router = useRouter()
  const code = params.code

  const createPopup = (nick: string) => {
    const newPopup = { id: Date.now(), message: nick }
    setPopups([...popups, newPopup])
  }

  const removePopup = (id: number) => {
    setPopups(popups.filter((popup) => popup.id !== id))
  }

  useEffect(() => {
    // console.log(`Emitting 'askGameStarted' with code: ${code}`);
    socket.emit('askGameStarted', code)
  }, [code])

  useEffect(() => {
    socket.on('isGameStarted', (isStarted: boolean) => {
      console.log('get isGame started....', isStarted)
      setIsGameStarted(isStarted)
    })
  }, [socket])

  useEffect(() => {
    socket.emit('findLobbyLeader', code)
    socket.on('setLeader', (isLeader: boolean) => {
      setLobbyLeader(isLeader)
      setIsLeaderSet(true)
    })
  }, [socket])

  useEffect(() => {
    socket.on('playerConDiscon', (message: string) => {
      createPopup(message)
    })
  }, [socket])

  useEffect(() => {
    if (isLeaderSet) {
      console.log(lobbyLeader, isGameStarted, 'lobbyLeader  isGameStarted')
      if (lobbyLeader && !isGameStarted) {
        console.log('starting the game')
        socket.emit('startGameTimer', code)
        setIsGameStarted(true)
      }
      if (!lobbyLeader && !isGameStarted) {
        setIsGameStarted(true)
      }
    }

    socket.on(
      'gameTimerUpdate',
      ({
        gameTimerValue,
        gamePhase,
      }: {
        gameTimerValue: number
        gamePhase: number
      }) => {
        setSeconds(gameTimerValue)
        setPhase(gamePhase)
        if (gamePhase !== 0) {
          setPrevPhase(gamePhase)
        }
      }
    )
  }, [socket, isLeaderSet]) //lobbyLeader

  useEffect(() => {
    socket.on('changePause', (pause: boolean) => {
      console.log('socketOn changePause', pause)
      setIsPaused(pause)
    })
  }, [socket, isPaused, isGameStarted]) //isPaused

  useEffect(() => {
    socket.on('gameEnded', () => {
      setIsGameEnded(true)
    })
  }, [socket, isGameEnded])

  const handleTogglePause = () => {
    console.log(isPaused)
    console.log('button presed', code)
    socket.emit('togglePause', code)
  }

  return (
    <div className={style.content}>
      <div>
        {popups.map((popup) => (
          <Popup
            key={popup.id}
            message={popup.message}
            onRemove={() => removePopup(popup.id)}
          />
        ))}
      </div>
      <div className={style.header}>
        <p className={style.lobby}>Код лобби: {code}</p>

        <div className={style.timeAndPause}>
          {isGameEnded ? null : (
            <>
              <p className={style.timer}>{seconds}</p>

              {lobbyLeader ? (
                <button
                  className={style.pauseButton}
                  onClick={handleTogglePause}
                >
                  {isPaused ? 'Продолжить' : 'Пауза'}
                </button>
              ) : (
                <p></p>
              )}
            </>
          )}
        </div>
      </div>
      <div className={style.body}>
        {phase === 0 ? (
          <div className={style.waiting}>
            {prevPhase === 1 ? (
              <>
                <p>
                  Придумайте шуточный вопрос, он достанется двум другим
                  случайным игрокам.
                </p>
                <br />
                <br />
                <p>Вопрос и ответы отправляются сами, по истечению времени!</p>
              </>
            ) : prevPhase === 2 ? (
              <>
                <p>Напишите два ответа на чужие вопросы.</p>
                <br />
                <p>Вопрос и ответы отправляются сами, по истечению времени!</p>
              </>
            ) : prevPhase === 3 ? (
              <>
                <p>Голосуйте за самый смешной ответ!</p>
                <br />
                <p>Если вы передумали - вы можете изменить свой выбор.</p>
              </>
            ) : prevPhase === 5 ? (
              <p>Давайте посмотрим на результаты!</p>
            ) : null}
          </div>
        ) : null}

        {phase === 1 ? (
          <Scores code={code} seconds={seconds} phase={phase}></Scores>
        ) : null}
        {phase === 2 ? (
          <WriteQuestions
            code={code}
            seconds={seconds}
            phase={phase}
          ></WriteQuestions>
        ) : null}
        {phase === 3 ? (
          <AnswerOnQuestions
            code={code}
            seconds={seconds}
            phase={phase}
          ></AnswerOnQuestions>
        ) : null}
        {phase === 4 || phase === 5 ? (
          <VoteForAnswer
            code={code}
            seconds={seconds}
            phase={phase}
          ></VoteForAnswer>
        ) : null}
      </div>
      {isGameEnded ? (
        <div className={style.footer}>
          <button onClick={() => router.push(`/`)} className={style.backToMenu}>
            Выйти в главное меню
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default Game
