'use client'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { webAppContext } from './context/'
import { useSocket } from './context/SocketContext'
import style from './Page.module.css'

export default function Home() {
  const [canPlay, setCanPlay] = useState<boolean>(true)
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

  useEffect(() => {
    if (app.version && socket) {
      socket.on('endAnotherSession', () => {
        setCanPlay(false)
      })
      return () => {
        socket.off('endAnotherSession')
      }
    }
  }, [socket, canPlay])

  if (!canPlay) {
    return <p>Закончите прошлую сессию и перезайдите</p>
  }
  return (
    <>
      {app.version ? (
        <div className={style.page}>
          <img
            className={style.roundOrange}
            src="/roundOrange.svg"
            alt="roundOrange"
          />
          <img
            className={style.roundBlue}
            src="/roundBlue.svg"
            alt="roundBlue"
          />
          <div className={style.header}>
            <p>Привет, {app.initDataUnsafe.user?.first_name || 'Dima'}</p>
          </div>
          <div className={style.buttons}>
            <button
              className={style.button}
              onClick={() => router.push('/openLobbies')}
            >
              <p className={style.text}>Открытые комнаты</p>
            </button>

            <button
              onClick={() => router.push('/join-lobby')}
              className={style.button}
            >
              <p className={style.text}>Зайти по коду</p>
            </button>
            <button
              onClick={() => router.push('/create-lobby')}
              className={style.button}
            >
              <p className={style.text}>Создать комнату</p>
            </button>
          </div>
        </div>
      ) : (
        <p>Загрузка данных пользователя...</p>
      )}
    </>
  )
}
