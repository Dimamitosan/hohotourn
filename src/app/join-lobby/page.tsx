'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../context/SocketContext'

const JoinLobby = () => {
  const [code, setCode] = useState('')
  const [lobbyStatus, setLobbyStatus] = useState<boolean | null>(null)
  const [lobbyText, setLobbyText] = useState('')
  const router = useRouter()
  const socket = useSocket()

  useEffect(() => {
    socket.on('lobbyStatus', (text: string, status: boolean) => {
      setLobbyStatus(status)
      console.log(text, 'статус - ', status)
      setLobbyText(text)
    })

    if (code.length === 5) {
      socket.emit('checkLobbyIsFull', code)
    }

    console.log(code.length)
    // Очистка события при размонтировании компонента
    return () => {
      socket.off('lobbyStatus')
    }
  }, [socket, code]) // Следим за изменениями в socket

  return (
    <div>
      <h1>Присоединиться к лобби</h1>
      <input
        type="text"
        placeholder="Введите код лобби"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase())
          console.log(code)
        }}
      />
      {code.length === 5 && lobbyStatus === true && (
        <button onClick={() => router.push(`/lobby/${code}`)}>
          Перейти в лобби
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
