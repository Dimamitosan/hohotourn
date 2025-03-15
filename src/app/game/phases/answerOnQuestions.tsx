'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons'

import style from './styles/answerOnQuestion.module.css'

interface Props {
  code: string
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
    if (phase === 3) {
      //&& seconds === 10
      //90
      socket.emit('requestQuestions', code)
    }
    return () => {
      socket.off('requestQuestions')
    }
  }, []) //[seconds, phase]

  useEffect(() => {
    socket.on('getQuestions', (data: Array<string>) => {
      setFirstQuestion(data[0])
      setSecondQuestion(data[1])
    })
  }, [firstQuestion, secondQuestion])

  useEffect(() => {
    if (phase === 3 && seconds === 0) {
      socket.emit('sendAnswers', [firstAnswer, secondAnswer])

      // setFirstAnswer('')
      // setSecondAnswer('')
      // setFirstAnswerIsReady(false)
      // setSecondAnswerIsReady(false)
    }
    return () => {
      socket.off('getStragersQuestion')
      socket.off('sendAnswers')
    }
  }, [phase, seconds])

  const handleReady = () => {
    setSecondAnswerIsReady(true)
    socket.emit('sendAnswers', [firstAnswer, secondAnswer])
    socket.emit('isReady', code)
  }

  return (
    <div className={style.content}>
      <p className={!firstAnswerIsReady ? style.hurryUp : style.hidden}>
        Поторопись, тебя ждет второй вопрос!
      </p>
      {!firstAnswerIsReady ? (
        <>
          <div className={style.question}>
            <p>{firstQuestion}</p>
          </div>
          <div className={style.answerArea}>
            <input
              className={style.inputAnswer}
              disabled={firstAnswerIsReady}
              type="text"
              maxLength={44}
              placeholder="Введите ответ на вопрос"
              value={firstAnswer}
              onChange={(e) => {
                setFirstAnswer(e.target.value)
              }}
            />

            <button
              className={style.sendButton}
              onClick={() => {
                setFirstAnswerIsReady(true)
              }}
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </>
      ) : null}

      {firstAnswerIsReady ? (
        <>
          <div className={style.question}>
            <p>{secondQuestion}</p>
          </div>
          <div className={style.answerArea}>
            <input
              className={`${style.inputAnswer} ${
                secondAnswerIsReady ? style.disabled : null
              }`}
              disabled={secondAnswerIsReady}
              type="text"
              maxLength={44}
              placeholder="Введите ответ на вопрос"
              value={secondAnswer}
              onChange={(e) => {
                setSecondAnswer(e.target.value)
              }}
            />

            <button
              className={`${style.sendButton} ${
                secondAnswerIsReady ? style.disabled : null
              }`}
              disabled={secondAnswerIsReady}
              onClick={handleReady}
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default AnswerOnQuestions
