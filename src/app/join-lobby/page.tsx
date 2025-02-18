'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '../context/SocketContext'
import style from './style.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'

const JoinLobby = () => {
  const [code, setCode] = useState('')
  const [lobbyStatus, setLobbyStatus] = useState<boolean | null>(null)
  const [lobbyText, setLobbyText] = useState('')
  const [urlToLobby, setUrlToLobby] = useState('')
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const router = useRouter()
  const socket = useSocket()

  useEffect(() => {
    if (code.length === 5) {
      socket.emit('checkLobbyIsFull', code)
    }
    socket.on(
      'lobbyStatus',
      (text: string, status: boolean, canReconnect: boolean = false) => {
        setLobbyStatus(status)
        setLobbyText(text)
        if (canReconnect) {
          setUrlToLobby(`/game/${code}`)
          setIsReconnecting(true)
        } else {
          setUrlToLobby(`/lobby/${code}`)
          setIsReconnecting(false)
        }
      }
    )

    return () => {
      socket.off('lobbyStatus')
    }
  }, [socket, code, lobbyStatus, lobbyText])

  const handleChangeCode = (value: string) => {
    setLobbyStatus(false)
    setCode(value.toUpperCase())
  }

  return (
    <div className={style.content}>
      <button className={style.back} onClick={() => router.push(`/`)}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={style.insertCode}>Введите код лобби</p>
      <div className={style.inputContainer}>
        <input
          className={` ${
            code.length === 5 && lobbyStatus === true
              ? style.inputDone
              : style.input
          }`}
          type="text"
          placeholder="*****"
          maxLength={5}
          value={code}
          onChange={(e) => {
            handleChangeCode(e.target.value)
          }}
        />
        {code.length === 5 && lobbyStatus === true && (
          <button
            className={`${style.inputButton} ${style.visible}`}
            onClick={() => {
              router.push(urlToLobby)
              if (isReconnecting) {
                socket.emit('joinLobby', code)
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        )}
      </div>

      {code.length === 5 && (
        <div
          style={{
            marginTop: '10px',
          }}
        >
          {lobbyText}
        </div>
      )}
    </div>
  )
}

export default JoinLobby
