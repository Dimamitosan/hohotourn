'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import style from './styles/scores.module.css'

interface Props {
  code: string
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
        data.sort((a, b) => b[1] - a[1])
        setScores(data) // Обновление состояния с полученными данными
      })
    }
    return () => {
      socket.off('scoresData') // Удаляем слушателя при размонтировании компонента
    }
  }, [phase, seconds, code])

  return (
    <div className={style.playersList}>
      <h2 className={style.players}>Счет:</h2>
      <ol className={style.playerRow}>
        {scores.map(([name, score], index) => (
          <li key={index}>
            {name}: {score}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default Scores
