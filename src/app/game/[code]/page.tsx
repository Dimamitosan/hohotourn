'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'

interface LobbyProps {
  params: any
}
const Game: React.FC<LobbyProps> = ({ params }) => {
  const [lobbyLeader, setLobbyLeader] = useState<boolean | null>(null)
  const [scores, setScores] = useState<any[]>([])
  const [seconds, setSeconds] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<number>(1)
  const [question, setQuestion] = useState<string>('')
  const [questionIsReady, setQuestionIsReady] = useState<boolean>(false)
  const [firstAnswer, setFirstAnswer] = useState<string>('')
  const [firstAnswerIsReady, setFirstAnswerIsReady] = useState<boolean>(false)
  const [secondAnswer, setSecondAnswer] = useState<string>('')
  const [secondAnswerIsReady, setSecondAnswerIsReady] = useState<boolean>(false)
  const [firstQuestion, setFirstQuestion] = useState<string>('')
  const [secondQuestion, setSecondQuestion] = useState<string>('')

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
        paused,
      }: {
        gameTimerValue: number
        gamePhase: number
        paused: boolean
      }) => {
        setSeconds(gameTimerValue)
        setPhase(gamePhase)
        setIsPaused(paused)
      }
    )
    return () => {
      socket.off('getLeader')
    }
  }, [socket, lobbyLeader])

  useEffect(() => {
    socket.on('changePause', () => {
      console.log('socketon changePause', !isPaused)
      setIsPaused((isPaused) => !isPaused)
    })

    socket.emit('getScores', code) // Запрос на получение данных

    socket.on('scoresData', (data: []) => {
      setScores(data) // Обновление состояния с полученными данными
    })

    return () => {
      socket.off('scoresData') // Удаляем слушателя при размонтировании компонента
    }
  }, [socket])

  useEffect(() => {
    if (phase === 2 && seconds === 0) {
      socket.emit('setNumbers', code)
      socket.emit('sendQuestion', [question, code])
      console.log('send question works!!!!!!!!')
      socket.on('getQuestions', (data: Array<string>) => {
        setFirstQuestion(data[0])
        setSecondQuestion(data[1])
      })
      console.log(firstQuestion, secondQuestion)
    }
    if (phase === 3 && seconds === 0) {
      socket.emit('sendAnswers', [firstAnswer, secondAnswer])
    }

    return () => {
      socket.off('setNumbers')
      socket.off('sendQuestion')
    }
  }, [phase, seconds, question, firstQuestion, secondQuestion])

  const handleTogglePause = () => {
    console.log('button presed')
    socket.emit('togglePause', code)
  }

  return (
    <div>
      <h1>Лобби: {code}</h1>
      {phase === 1 ? (
        <div>
          <h2>Игроки:</h2>

          <ul>
            {scores.map(([name, score], index) => (
              <li key={index}>
                {name} : {score}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {phase === 2 ? (
        <div>
          <input
            disabled={questionIsReady}
            type="text"
            placeholder="Введите вопрос для других игроков"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value)
            }}
          />
          {questionIsReady ? null : (
            <button
              onClick={() => {
                setQuestionIsReady(true)
              }}
            >
              Отправить
            </button>
          )}
        </div>
      ) : null}
      {phase === 3 ? (
        <div>
          {firstQuestion}
          <input
            disabled={firstAnswerIsReady}
            type="text"
            placeholder="Введите ответ на вопрос"
            value={firstAnswer}
            onChange={(e) => {
              setFirstAnswer(e.target.value)
            }}
          />
          {questionIsReady ? null : (
            <button
              onClick={() => {
                setFirstAnswerIsReady(true)
              }}
            >
              Отправить
            </button>
          )}

          {secondQuestion}
          <input
            disabled={secondAnswerIsReady}
            type="text"
            placeholder="Введите ответ на вопрос"
            value={secondAnswer}
            onChange={(e) => {
              setSecondAnswer(e.target.value)
            }}
          />
          {questionIsReady ? null : (
            <button
              onClick={() => {
                setSecondAnswerIsReady(true)
              }}
            >
              Отправить
            </button>
          )}
        </div>
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
            <br />
            {lobbyLeader + ' lobby leader'}
            <br />
            {isPaused + ' paused?'}
          </>
        ) : null}
      </>
      {question + ' 1'}
    </div>
  )
}

export default Game
