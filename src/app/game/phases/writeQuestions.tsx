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

  const [canGetRandomQuestion, setCanGetRandomQuestion] =
    useState<boolean>(true)
  const socket = useSocket()

  useEffect(() => {
    if (phase === 2 && seconds <= 2) {
      //ввод вопросов, в конце они отправляются и получаются чужие вопросы

      setCanGetRandomQuestion(true)
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
      setCanGetRandomQuestion(false)
    })
    return () => {
      socket.off('getRandomQuestion')
    }
  }, [socket, question, canGetRandomQuestion])

  const getRandomQuestion = () => {
    socket.emit('requestRandomQuestion', code)
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

      <button
        disabled={!canGetRandomQuestion}
        className={style.randomQuestion}
        onClick={getRandomQuestion}
      >
        Случайный вопрос
      </button>
    </div>
  )
}

export default WriteQuestions
