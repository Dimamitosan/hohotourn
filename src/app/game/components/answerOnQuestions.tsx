'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'

interface Props {
  code: any
  seconds: number
  phase: number
}
const AnswerOnQuestions: React.FC<Props> = ({ code, seconds, phase }) => {
  const [firstAnswer, setFirstAnswer] = useState<string>('')
  const [firstAnswerIsReady, setFirstAnswerIsReady] = useState<boolean>(false)
  const [secondAnswer, setSecondAnswer] = useState<string>('')
  const [secondAnswerIsReady, setSecondAnswerIsReady] = useState<boolean>(false)
  const [firstQuestion, setFirstQuestion] = useState<string>('')
  const [secondQuestion, setSecondQuestion] = useState<string>('')
  const socket = useSocket()

  useEffect(() => {
    socket.on('getQuestions', (data: Array<string>) => {
      setFirstQuestion(data[0])
      setSecondQuestion(data[1])
    })
  }, [firstQuestion, secondQuestion])

  useEffect(() => {
    if (phase === 3 && seconds === 0) {
      socket.emit('sendAnswers', [firstAnswer, secondAnswer])

      setFirstAnswer('')
      setSecondAnswer('')
      console.log('sended answers')
      console.log('trying to get strangers data')
      setFirstAnswerIsReady(false)
      setSecondAnswerIsReady(false)
    }
    return () => {
      socket.off('getStragersQuestion')
      socket.off('sendAnswers')
    }
  }, [phase, seconds])

  return (
    <div>
      {firstQuestion}
      <input
        disabled={firstAnswerIsReady}
        type="text"
        placeholder="Введите ответ на вопрос"
        value={firstAnswer}
        onChange={(e) => {
          setFirstAnswer(e.target.value)
        }}
      />
      {firstAnswerIsReady ? null : (
        <button
          onClick={() => {
            setFirstAnswerIsReady(true)
          }}
        >
          Отправить
        </button>
      )}

      {secondQuestion}
      <input
        disabled={secondAnswerIsReady}
        type="text"
        placeholder="Введите ответ на вопрос"
        value={secondAnswer}
        onChange={(e) => {
          setSecondAnswer(e.target.value)
        }}
      />
      {secondAnswerIsReady ? null : (
        <button
          onClick={() => {
            setSecondAnswerIsReady(true)
          }}
        >
          Отправить
        </button>
      )}
    </div>
  )
}

export default AnswerOnQuestions
