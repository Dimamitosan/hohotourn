'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'

interface LobbyProps {
  params: any
}
const Game: React.FC<LobbyProps> = ({ params }) => {
  const [scores, setScores] = useState<any[]>([])
  const [seconds, setSeconds] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<number>(1)
  const [question, setQuestion] = useState<string>('')
  const [questionIsReady, setQuestionIsReady] = useState<boolean>(false)

  const socket = useSocket()
  const code = params.code

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
    // Функция для заполнения таймера
    const tick = () => {
      if (isPaused) return // Если таймер на паузе, ничего не делаем
      setSeconds((prevSeconds) => {
        if (prevSeconds > 0) {
          return prevSeconds - 1 // Уменьшаем секунды на 1
        } else if (phase === 1) {
          setPhase(2) // Переходим во вторую фазу
          return 10 // Устанавливаем секунд на 10 для второй фазы
        } else if (phase === 2) {
          setPhase(3)
          socket.emit('sendQuestion', [code, question])
          return 10
        } else {
          return 0 // Завершаем таймер
        }
      })
    }

    // Запускаем интервал
    const intervalId = setInterval(tick, 1000)

    // Очистка интервала при размонтировании компонента
    return () => {
      clearInterval(intervalId)
    }
  }, [isPaused, phase])

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
            <button onClick={() => setQuestionIsReady(true)}>Отправить</button>
          )}
        </div>
      ) : null}
      время - {seconds}
      <br />
      фаза - {phase}
      <br />
      <button onClick={handleTogglePause}>
        {isPaused ? 'Продолжить' : 'Пауза'}
      </button>
    </div>
  )
}

export default Game
