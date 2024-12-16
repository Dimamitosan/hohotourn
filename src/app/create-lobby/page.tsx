'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '@/app/context/SocketContext'
import { useRouter } from 'next/navigation'
import style from './style.module.css'
const CreateLobby = () => {
  const [lobbyCode, setLobbyCode] = useState('')
  const [countOfPlayers, setCountOfPlayers] = useState(10)
  const [countOfRounds, setCountOfRounds] = useState(3)
  const [isLobbyOpen, setIsLobbyOpen] = useState<Boolean>(false)
  const router = useRouter()
  const socket = useSocket()

  const createLobby = () => {
    socket.emit('createLobby', [countOfPlayers, countOfRounds, isLobbyOpen])
    socket.on('lobbyCreated', (code: string) => {
      setLobbyCode(code) // Устанавливаете код лобби
      router.push(`/lobby/${code}`) // Перенаправляете на лобби
    })
  }
  const handleCheckboxChange = (checked: boolean) => {
    setIsLobbyOpen(checked)
  }

  return (
    <div className={style.body}>
      <button className={style.back} onClick={() => router.push(`/`)}>
        {'<'}
      </button>
      <p className={style.title}>Создание лобби</p>

      <div className={style.lobbySettings}>
        <div className={style.setting}>
          <p className={style.settingTitle}>Игроки</p>
          <div className={style.inputRow}>
            <button
              className={style.buttonInput}
              onClick={() => {
                if (countOfPlayers > 3) {
                  setCountOfPlayers(countOfPlayers - 1)
                }
              }}
            >
              <p className={style.sign}>-</p>
            </button>

            <p className={style.count}>{countOfPlayers}</p>
            <button
              className={style.buttonInput}
              onClick={() => {
                if (countOfPlayers < 10) {
                  setCountOfPlayers(countOfPlayers + 1)
                }
              }}
            >
              <p className={style.sign}>+</p>
            </button>
          </div>
        </div>

        <div className={style.setting}>
          <p className={style.settingTitle}>Раунды</p>
          <div className={style.inputRow}>
            <button
              className={style.buttonInput}
              onClick={() => {
                if (countOfRounds > 1) {
                  setCountOfRounds(countOfRounds - 1)
                }
              }}
            >
              <p className={style.sign}>-</p>
            </button>

            <p className={style.count}>{countOfRounds}</p>
            <button
              className={style.buttonInput}
              onClick={() => {
                if (countOfRounds < 5) {
                  setCountOfRounds(countOfRounds + 1)
                }
              }}
            >
              <p className={style.sign}>+</p>
            </button>
          </div>
        </div>
        <div className={style.setting}>
          <p className={style.settingTitle}>Открытое лобби</p>
          <input
            type="checkbox"
            className={style.checkbox}
            checked={Boolean(isLobbyOpen)}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
          />
          {/* <p className={style.setingTitle}>Тип лобби</p>
          <div className={style.inputRow}>
            <p className={style.settingChoise}>Закрытый</p>
          </div> */}
        </div>
      </div>

      <button onClick={createLobby} className={style.createButton}>
        <p>Создать</p>
      </button>
    </div>
  )
}

export default CreateLobby
