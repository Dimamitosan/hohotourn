'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'

import style from './styles/voteForAnswer.module.css'

interface Props {
  code: any
  seconds: number
  phase: number
}
const VoteForAnswer: React.FC<Props> = ({ code, seconds, phase }) => {
  const [strangersQuestion, setStrangersQuestion] = useState<string>('')
  const [strangersAnswers, setStrangersAnswers] = useState<string[]>([])
  const [canVote, setCanVote] = useState<boolean>(false)
  const [canChangeAnswer, setCanChangeAnswer] = useState<boolean>(true)
  const [ownerOfFirstAnswer, setOwnerOfFirstAnswer] = useState<string>('')
  const [ownerOfSecondAnswer, setOwnerOfSecondAnswer] = useState<string>('')
  const [ownerOfQuestion, setOwnerOfQuestion] = useState<string>('')
  const [numberOfQuestion, setNumberOfQuestion] = useState<number>(1)
  const [arrOfPlayersVotes, setArrOfPlayersVotes] = useState<any[]>([
    [''],
    [''],
  ])
  const [numberOfVote, setNumberOfVote] = useState<number | null>(null)

  const socket = useSocket()

  useEffect(() => {
    if (phase === 4) {
      // console.log('askNewNumberOfquestion -----------------aaaaaaaaaaaaaaaa1')
      socket.emit('askNewNumberOfquestion', code)
      setNumberOfVote(null)
    }
  }, [phase, code])

  useEffect(() => {
    if (phase === 5) {
      // console.log('askNewNumberOfquestion -----------------aaaaaaaaaaaaaaaa2')
      socket.emit('askNewNumberOfquestion', code)
      socket.emit('askArrOfVotes', code)
    }
  }, [phase, code])

  useEffect(() => {
    socket.on('getNewNumberOfquestion', (number: number) => {
      if (number != numberOfQuestion) {
        setCanChangeAnswer(true)
      }
      setNumberOfQuestion(number)
    })
  }, [socket, numberOfQuestion])

  useEffect(() => {
    if ((phase === 4 && canChangeAnswer) || (phase === 5 && canChangeAnswer)) {
      //&& seconds === 15

      socket.emit('getStragersQuestion', [code, numberOfQuestion])
      socket.on(
        'takeStragersQuestion',
        ([
          [
            [firstStrangerAnswer, firstStrangersNick],
            [secondStrangerAnswer, seconStrangersNick],
          ],
          [question, ownerOfQuestion],
          canVote,
        ]: any) => {
          setStrangersQuestion(question)
          setOwnerOfQuestion(ownerOfQuestion)
          setOwnerOfFirstAnswer(firstStrangersNick)
          setOwnerOfSecondAnswer(seconStrangersNick)
          setStrangersAnswers([firstStrangerAnswer, secondStrangerAnswer])
          setCanVote(canVote)
        }
      )

      setCanChangeAnswer(false)
    }
    return () => {
      socket.off('getStragersQuestion')
    }
  }, [
    phase,
    seconds,

    strangersAnswers,
    strangersQuestion,
    canVote,
    canChangeAnswer,
  ])

  useEffect(() => {
    socket.on('getArrOfVotes', (arrOfVotes: [][]) => {
      setArrOfPlayersVotes(arrOfVotes)
      console.log(arrOfVotes)
    })

    return () => {
      socket.off('getArrOfVotes')
    }
  }, [arrOfPlayersVotes])

  const handleClickVote = (voteNumber: number) => {
    if (voteNumber != numberOfVote) {
      setNumberOfVote(voteNumber)
      socket.emit('voteForAnswer', voteNumber)
    }
  }

  return (
    <div className={style.content}>
      {phase === 5 && (
        <p className={style.ownerOfQuestion}>{ownerOfQuestion}</p>
      )}

      <div className={style.question}>
        <p>{strangersQuestion}</p>
      </div>

      {phase === 4 && (
        <p>{canVote ? 'Выберите лучший ответ!' : 'Вы не голосуете!'}</p>
      )}

      <div className={style.answerArea}>
        <div className={style.numberOfQuestion}>
          {/* <p>Первый ответ: </p> */}
          {phase === 5 ? (
            <p className={style.owner}>{ownerOfFirstAnswer}</p>
          ) : null}
        </div>
        {/* <p >Первый ответ</p> */}
        {/* {phase === 4 ? ( */}

        <button
          className={`${style.answerButton} ${
            phase === 5 ? style.disabled : null
          } ${numberOfVote === 1 ? style.active : null}`}
          disabled={phase === 4 ? !canVote : true}
          onClick={() => {
            handleClickVote(1)
          }}
        >
          <p>{strangersAnswers[0]}</p>
        </button>
        {/* ) : (
          <div>
            <p className={style.owner}>{ownerOfFirstAnswer}</p>
            <p className={style.answer}>{strangersAnswers[0]}</p>
          </div>
        )} */}
      </div>
      <div className={style.answerArea}>
        <div className={style.numberOfQuestion}>
          {/* <p>Второй ответ</p> */}
          {phase === 5 ? (
            <p className={style.owner}>{ownerOfSecondAnswer}</p>
          ) : null}
        </div>
        {/* <p className={style.numberOfQuestion}>Второй ответ</p> */}
        {/* {phase === 4 ? ( */}
        {/* {phase === 5 ? (
          <p className={style.owner}>{ownerOfSecondAnswer}</p>
        ) : null} */}
        <button
          className={`${style.answerButton} ${
            phase === 5 ? style.disabled : null
          } ${numberOfVote === 2 ? style.active : null}`}
          disabled={phase === 4 ? !canVote : true}
          onClick={() => {
            handleClickVote(2)
          }}
        >
          <p>{strangersAnswers[1]}</p>
        </button>
        {/* ) : (
          <div>
            <p className={style.owner}>{ownerOfSecondAnswer}</p>
            <p className={style.answer}>{strangersAnswers[1]}</p>
          </div>
        )} */}
      </div>

      {phase === 5 && (
        <div className={style.votes}>
          <ul className={style.ul}>
            Голоса за первый ответ
            {arrOfPlayersVotes[0].map((nick: string, index: number) => (
              <li className={style.li} key={index}>
                {nick}
              </li>
            ))}
          </ul>
          <ul className={style.ul}>
            Голоса за второй ответ
            {arrOfPlayersVotes[1].map((nick: string, index: number) => (
              <li className={style.li} key={index}>
                {nick}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default VoteForAnswer
