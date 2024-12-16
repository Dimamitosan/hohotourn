'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '@/app/context/SocketContext'
import { useRouter } from 'next/navigation'
import style from './openLobbies.module.css'
import test from 'node:test'

const OpenLobbies = () => {
  const [lobbies, setLobbies] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [text, setText] = useState('')
  const router = useRouter()
  const socket = useSocket()

  useEffect(() => {
    socket.emit('loadLobbies', 0)
    return () => {
      socket.off('loadLobbies')
    }
  }, [])

  useEffect(() => {
    socket.on('lobbiesLoaded', (newLobbies: []) => {
      const existingLobbiesSet = new Set(lobbies.map((lobby) => lobby[0]))
      const filteredNewLobbies = newLobbies.filter(
        (lobby) => !existingLobbiesSet.has(lobby[0])
      )
      if (page > 0) {
        setLobbies((prevLobbies) => [...prevLobbies, ...filteredNewLobbies]) //
      } else {
        setLobbies(filteredNewLobbies)
      }
    })

    return () => {
      socket.off('lobbiesLoaded')
    }
  }, [page])

  const reload = () => {
    setText('')
    setLobbies([]) // Очистите список лобби перед новым запросом
    setPage(0)
    console.log('reloading.....')
    socket.emit('loadLobbies', 0)
  }

  const loadMoreLobbies = () => {
    setPage((prevPage) => prevPage + 1)
    socket.emit('loadLobbies', page + 1)
  }
  useEffect(() => {})

  const tryToEnter = (code: string) => {
    socket.emit('checkLobbyIsFull', code)
    socket.on('lobbyStatus', (text: string, status: boolean) => {
      if (status) {
        router.push(`/lobby/${code}`)
      } else {
        setText(text)
      }
    })
  }

  return (
    <div className={style.content}>
      <div className={style.headder}>
        <button className={style.roundButton} onClick={() => router.push(`/`)}>
          {'<'}
        </button>
        <button className={style.roundButton} onClick={reload}>
          {'reload'}
        </button>
      </div>
      <div className={style.body}>
        {text ? (
          <p className={style.message}>
            {text} <br /> Перезагрузите список!
          </p>
        ) : null}

        <ul className={style.listOfLobbies}>
          {lobbies.map(([code, count, max], index) => (
            <li key={index} className={style.row}>
              <button
                className={style.lobbyButton}
                onClick={() => tryToEnter(code)}
              >
                <p className={style.code}>{code}</p>
                <p className={style.playerCount}>
                  {count}/{max}
                </p>
              </button>
            </li>
          ))}
          <li>
            <button className={style.loadMore} onClick={loadMoreLobbies}>
              <p>Загрузить еще</p>
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default OpenLobbies
