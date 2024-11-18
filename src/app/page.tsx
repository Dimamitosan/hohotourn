'use client'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { webAppContext } from './context/'
import { useSocket } from './context/SocketContext'
import style from './Page.module.css'

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
        <div className={style.page}>
          <div className={style.header}>
            <b>Привет, {app.initDataUnsafe.user?.first_name || 'Dima'}</b>
          </div>
          <div className={style.buttons}>
            <button
              disabled={true}
              className={`${style.button} ${style.disabled}`}
            >
              <b>Найти игру</b>
            </button>

            <button
              onClick={() => router.push('/join-lobby')}
              className={style.button}
            >
              <b>Зайти по коду</b>
            </button>
            <button
              onClick={() => router.push('/create-lobby')}
              className={style.button}
            >
              <b>Создать комнату</b>
            </button>
          </div>
        </div>
      ) : (
        <p>Загрузка данных пользователя...</p>
      )}
    </>
  )
}
