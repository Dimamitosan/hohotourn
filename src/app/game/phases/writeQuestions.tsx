'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'

import style from './styles/writeQuestion.module.css'

interface Props {
  code: any
  seconds: number
  phase: number
}
const WriteQuestions: React.FC<Props> = ({ code, seconds, phase }) => {
  const [question, setQuestion] = useState<string>('')
  const [isReady, setIsReady] = useState<boolean>(false)

  const [canGetRandomQuestion, setCanGetRandomQuestion] =
    useState<boolean>(true)
  const socket = useSocket()

  useEffect(() => {
    if (phase === 2) {
      //&& seconds === 10
      //60
      setCanGetRandomQuestion(true)
    }
  }, [])

  useEffect(() => {
    if (phase === 2 && seconds <= 2 && !isReady) {
      socket.emit('sendQuestion', question)
    }

    return () => {
      socket.off('setNumbers')
      socket.off('sendQuestion')
    }
  }, [phase, seconds, question])

  useEffect(() => {
    socket.on('getRandomQuestion', (randomQuestion: string) => {
      setQuestion(randomQuestion)
    })
    return () => {
      socket.off('getRandomQuestion')
    }
  }, [socket, question, canGetRandomQuestion])

  const getRandomQuestion = () => {
    setCanGetRandomQuestion(false)
    socket.emit('requestRandomQuestion', code)
  }

  const handleReady = () => {
    setIsReady(true)
    socket.emit('sendQuestion', question)
    socket.emit('isReady', code)
  }

  return (
    <div className={style.content}>
      <input
        className={style.inputQuestion}
        type="text"
        maxLength={75}
        placeholder="Введите вопрос для других игроков"
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value)
        }}
      />

      <div className={style.rowOfButtons}>
        <button
          disabled={!canGetRandomQuestion}
          className={`${style.randomQuestion} ${
            canGetRandomQuestion ? null : style.disabled
          }`}
          onClick={getRandomQuestion}
        >
          Случайный вопрос
        </button>
        <button
          disabled={isReady}
          className={`${style.readyButton} ${!isReady ? null : style.disabled}`}
          onClick={handleReady}
        >
          Отправить
        </button>
      </div>
    </div>
  )
}

export default WriteQuestions
