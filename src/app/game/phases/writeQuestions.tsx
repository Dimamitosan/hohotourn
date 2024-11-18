'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'

interface Props {
  code: any
  seconds: number
  phase: number
}
const WriteQuestions: React.FC<Props> = ({ code, seconds, phase }) => {
  const [question, setQuestion] = useState<string>('')
  const [questionIsReady, setQuestionIsReady] = useState<boolean>(false)
  const socket = useSocket()

  useEffect(() => {
    if (phase === 2 && seconds === 0) {
      //ввод вопросов, в конце они отправляются и получаются чужие вопросы

      socket.emit('setNumbers', code)
      socket.emit('sendQuestion', [question, code])
      setQuestionIsReady(false)
    }

    setQuestionIsReady(false)
    return () => {
      socket.off('setNumbers')
      socket.off('sendQuestion')
    }
  }, [phase, seconds, question])

  return (
    <div>
      <input
        disabled={questionIsReady}
        type="text"
        placeholder="Введите вопрос для других игроков"
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value)
        }}
      />
      {questionIsReady ? null : (
        <button
          onClick={() => {
            setQuestionIsReady(true)
          }}
        >
          Отправить
        </button>
      )}
    </div>
  )
}

export default WriteQuestions
