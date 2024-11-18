'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'
import Scores from '../phases/scores'
import WriteQuestions from '../phases/writeQuestions'
import AnswerOnQuestions from '../phases/answerOnQuestions'
import VoteForAnswer from '../phases/voteForAnswer'

interface LobbyProps {
  params: any
}
const Game: React.FC<LobbyProps> = ({ params }) => {
  const [lobbyLeader, setLobbyLeader] = useState<boolean | null>(null)
  const [seconds, setSeconds] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<number>(1)

  const socket = useSocket()
  const code = params.code

  useEffect(() => {
    socket.emit('findLobbyLeader', code)
    socket.on('getLeader', (isLeader: boolean) => {
      setLobbyLeader(isLeader)
    })
  }, [socket, lobbyLeader])

  useEffect(() => {
    if (lobbyLeader) {
      socket.emit('startGameTimer', code)
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
      }
    )
    return () => {
      socket.off('getLeader')
    }
  }, [socket, lobbyLeader])

  useEffect(() => {
    socket.on('changePause', () => {
      console.log('socketOn changePause', !isPaused)
      setIsPaused((isPaused) => !isPaused)
    })
  }, [socket]) //isPaused

  const handleTogglePause = () => {
    console.log(isPaused)
    console.log('button presed')
    socket.emit('togglePause', code)
  }

  return (
    <div>
      <h1>Лобби: {code}</h1>
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
      время - {seconds}
      <br />
      фаза - {phase}
      <br />
      <>
        {lobbyLeader ? (
          <>
            <button onClick={handleTogglePause}>
              {isPaused ? 'Продолжить' : 'Пауза'}
            </button>{' '}
          </>
        ) : null}
      </>
    </div>
  )
}

export default Game
