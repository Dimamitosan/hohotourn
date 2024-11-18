'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'

interface Props {
  code: any
  seconds: number
  phase: number
}
const Scores: React.FC<Props> = ({ code, seconds, phase }) => {
  const [scores, setScores] = useState<any[]>([])
  const socket = useSocket()

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
      <h2>Игроки:</h2>

      <ul>
        {scores.map(([name, score], index) => (
          <li key={index}>
            {name} : {score}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Scores
