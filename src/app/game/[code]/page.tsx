'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../../context/SocketContext'

interface LobbyProps {
  params: any
}
const Game: React.FC<LobbyProps> = ({ params }) => {
  const [scores, setScores] = useState<any[]>([])

  const socket = useSocket()
  const code = params.code

  useEffect(() => {
    socket.emit('getScores', code) // Запрос на получение данных

    socket.on('scoresData', (data: []) => {
      setScores(data) // Обновление состояния с полученными данными
    })

    return () => {
      socket.off('scoresData') // Удаляем слушателя при размонтировании компонента
    }
  }, [])
  return (
    <div>
      <h1>Лобби: {code}</h1>
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

export default Game
