'use client'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { webAppContext } from './context/'
import { useSocket } from './context/SocketContext'
import style from './Page.module.css'
import Help from './modal/modal'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil } from '@fortawesome/free-solid-svg-icons'

export default function Home() {
  const [canPlay, setCanPlay] = useState<boolean>(true)
  const [loadingData, setLoadingData] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState<string>('')

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
      socket.on('getUserName', (name: string) => {
        setName(name)
      })
    }
  }, [socket, name])

  useEffect(() => {
    ;(async () => {
      await setTimeout(() => {
        setLoadingData(false)
      }, 4000)
    })()
  })

  useEffect(() => {
    if (app.version && socket) {
      setName(app.initDataUnsafe.user!.first_name)
    }
  }, [])

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

  const changeNick = (newNick: string) => {
    if (newNick) {
      setName(newNick)
      socket.emit('userChangeNick', newNick)
    }
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  if (loadingData) {
    return (
      <div className={style.loading}>
        <p className={style.loading_text}>Загрузка данных</p>
        <div className={style.loading_dots}>
          <ul className={style.dots_row}>
            <li className={style.dot}></li>
            <li className={style.dot}></li>
            <li className={style.dot}> </li>
            <li className={style.dot}></li>
            <li className={style.dot}> </li>
          </ul>
        </div>
      </div>
    )
  }

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
          {/* app.initDataUnsafe.user!.first_name */}
          <div className={style.header}>
            <p className={style.hello}>Привет,</p>
            <div className={style.header_name}>
              <p>{name}</p>
              <button onClick={openModal} className={style.changeNick}>
                <img
                  className={style.pencil}
                  src="pencil.svg"
                  width={18}
                  height={18}
                  alt=""
                />
              </button>
            </div>
          </div>

          <div className={style.content}>
            <Help
              isOpen={isModalOpen}
              onClose={closeModal}
              changeNick={changeNick}
            ></Help>
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
