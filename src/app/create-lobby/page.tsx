'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '@/app/context/SocketContext'
import { useRouter } from 'next/navigation'
import style from './style.module.css'
const CreateLobby = () => {
  const [lobbyCode, setLobbyCode] = useState('')
  const [countOfPlayers, setCountOfPlayers] = useState(10)
  const [countOfRounds, setCountOfRounds] = useState(3)
  const router = useRouter()
  const socket = useSocket()

  const createLobby = () => {
    socket.emit('createLobby', [countOfPlayers, countOfRounds])
    socket.on('lobbyCreated', (code: string) => {
      setLobbyCode(code) // Устанавливаете код лобби
      router.push(`/lobby/${code}`) // Перенаправляете на лобби
    })
  }

  return (
    <div className={style.body}>
      <div className={style.header}>
        <h1>Создание лобби</h1>
      </div>
      <div className={style.lobbySettings}>
        <div className={style.setting}>
          <b>Игроки</b>
          <input
            className={style.input}
            type="number"
            id="numberOfPlayers"
            value={countOfPlayers}
            max={10}
            min={3}
            defaultValue={10}
            onChange={(event) => {
              if (
                Number(event.target.value) <= 10 &&
                Number(event.target.value) >= 3
              ) {
                setCountOfPlayers(Number(event.target.value))
              } else {
                setCountOfPlayers(3)
              }
            }}
          />
        </div>
        <div className={style.setting}>
          <b>Раунды</b>
          <input
            className={style.input}
            type="number"
            id="numberOfrounds"
            max={5}
            min={1}
            defaultValue={3}
            onChange={(event) => setCountOfRounds(Number(event.target.value))}
          />
        </div>
        <div className={style.setting}>
          <b>Тип лобби</b>
          <p>Закрытый</p>
        </div>
      </div>

      <button onClick={createLobby} className={style.createButton}>
        <b>Создать</b>
      </button>
    </div>
  )
}

export default CreateLobby
