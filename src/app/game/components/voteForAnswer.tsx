'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'

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
  const [arrOfPlayersVotes, setArrOfPlayersVotes] = useState<any[]>([])

  const socket = useSocket()

  useEffect(() => {
    socket.on('getNewNumberOfquestion', (number: number) => {
      if (number != numberOfQuestion) {
        setCanChangeAnswer(true)
      }
      setNumberOfQuestion(number)
    })
  }, [socket, numberOfQuestion])

  useEffect(() => {
    if (phase === 4 && seconds === 10 && canChangeAnswer) {
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
      console.log(strangersAnswers, strangersQuestion, canVote)
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
    })

    return () => {
      socket.off('getArrOfVotes')
    }
  }, [arrOfPlayersVotes])

  return (
    <div>
      вопрос:
      {phase === 4
        ? strangersQuestion
        : `${strangersQuestion} - ${ownerOfQuestion}`}
      <br />
      первый ответ
      {phase === 4
        ? strangersAnswers[0]
        : `${strangersAnswers[0]} - ${ownerOfFirstAnswer}`}
      <br />
      второй ответ
      {phase === 4
        ? strangersAnswers[1]
        : `${strangersAnswers[1]} - ${ownerOfSecondAnswer}`}
      <br />
      номер вопроса
      {numberOfQuestion}
      <br />
      {phase === 4 ? (
        canVote ? (
          <div>
            <button
              onClick={() => {
                socket.emit('voteForAnswer', 1)
              }}
            >
              первый ответ
            </button>
            <button
              onClick={() => {
                socket.emit('voteForAnswer', 2)
              }}
            >
              второй ответ
            </button>
          </div>
        ) : null
      ) : (
        <div>
          <ul>
            голоса за первый ответ
            {arrOfPlayersVotes[0].map((nick: string, index: number) => (
              <li key={index}>{nick}</li>
            ))}
          </ul>
          <ul>
            голоса за второй ответ
            {arrOfPlayersVotes[1].map((nick: string, index: number) => (
              <li key={index}>{nick}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default VoteForAnswer
