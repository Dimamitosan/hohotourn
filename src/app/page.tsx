'use client'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { webAppContext } from './context/'
import { useSocket } from './context/SocketContext'

export default function Home() {
  const app = useContext(webAppContext)
  const router = useRouter()
  const socket = useSocket()

  useEffect(() => {
    if (app.version && socket) {
      socket.emit('userEnter', [
        app.initDataUnsafe.user?.id,
        app.initDataUnsafe.user?.first_name,
      ])
    }
  }, [socket, app])

  return (
    <>
      {app.version ? (
        <div>
          <h1>Добро пожаловать в игру</h1>
          <p>Привет, {app.initDataUnsafe.user?.first_name || 'dima'}</p>
          <button onClick={() => router.push('/create-lobby')}>
            Создать лобби
          </button>
          <button onClick={() => router.push('/join-lobby')}>
            Присоединиться к лобби
          </button>
        </div>
      ) : (
        <p>Загрузка данных пользователя...</p>
      )}
    </>
  )
}
