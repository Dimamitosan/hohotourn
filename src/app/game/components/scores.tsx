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

  const [phase, setPhase] = useState<number>(1)

  const socket = useSocket()
  const code = params.code

  useEffect(() => {
    if (phase === 1 && seconds === 5) {
      socket.emit('getScores', code) // Запрос на получение данных

      socket.on('scoresData', (data: []) => {
        setScores(data) // Обновление состояния с полученными данными
      })
    }
    return () => {
      socket.off('scoresData') // Удаляем слушателя при размонтировании компонента
    }
  }, [phase, seconds, code])

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
    </div>
  )
}

export default Game
