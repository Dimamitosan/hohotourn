'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '@/app/context/SocketContext'
import { useRouter } from 'next/navigation'

const CreateLobby = () => {
  const [lobbyCode, setLobbyCode] = useState('')
  const router = useRouter()
  const socket = useSocket()

  useEffect(() => {
    socket.emit('createLobby')
    socket.on('lobbyCreated', (code: string) => {
      setLobbyCode(code) // Устанавливаете код лобби
      router.push(`/lobby/${code}`) // Перенаправляете на лобби
    })

    return () => {
      socket.off('lobbyCreated') // Отписываемся от события
    }
  }, [socket, router])

  return <h1>Создание лобби...</h1>
}

export default CreateLobby
