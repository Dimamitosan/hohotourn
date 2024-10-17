'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '@/app/context/SocketContext'
import { useRouter } from 'next/navigation'

const CreateLobby = () => {
  const [lobbyCode, setLobbyCode] = useState('')
  const [countOfPlayers, setCountOfPlayers] = useState('10')
  const router = useRouter()
  const socket = useSocket()

  const createLobby = () => {
    socket.emit('createLobby', countOfPlayers)
    socket.on('lobbyCreated', (code: string) => {
      setLobbyCode(code) // Устанавливаете код лобби
      router.push(`/lobby/${code}`) // Перенаправляете на лобби
    })
  }

  return (
    <>
      <input
        type="number"
        id="numberOfPlayers"
        max={10}
        min={1}
        defaultValue={10}
        onChange={(event) => setCountOfPlayers(event.target.value)}
      />
      <button onClick={createLobby}>Submit</button>

      <h1>Создание лобби...</h1>
    </>
  )
}

export default CreateLobby
