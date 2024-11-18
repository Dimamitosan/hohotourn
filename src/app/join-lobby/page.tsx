'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../context/SocketContext'
import style from './style.module.css'

const JoinLobby = () => {
  const [code, setCode] = useState('')
  const [lobbyStatus, setLobbyStatus] = useState<boolean | null>(null)
  const [lobbyText, setLobbyText] = useState('')
  const router = useRouter()
  const socket = useSocket()

  useEffect(() => {
    socket.on('lobbyStatus', (text: string, status: boolean) => {
      setLobbyStatus(status)

      setLobbyText(text)
    })

    if (code.length === 5) {
      socket.emit('checkLobbyIsFull', code)
    }

    // Очистка события при размонтировании компонента
    return () => {
      socket.off('lobbyStatus')
    }
  }, [socket, code]) // Следим за изменениями в socket

  return (
    <div className={style.content}>
      <b className={style.insertCode}>Введите код</b>
      <input
        className={style.input}
        type="text"
        placeholder="Введите код лобби"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase())
        }}
      />
      {code.length === 5 && lobbyStatus === true && (
        <button
          className={style.button}
          onClick={() => router.push(`/lobby/${code}`)}
        >
          <b>Перейти в лобби</b>
        </button>
      )}
      {code.length === 5 && (
        <div
          style={{
            marginTop: '10px',
            color: lobbyStatus === false ? 'red' : 'green',
          }}
        >
          {lobbyText}
        </div>
      )}
    </div>
  )
}

export default JoinLobby
