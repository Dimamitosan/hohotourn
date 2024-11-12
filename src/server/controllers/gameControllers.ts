import { Socket } from 'socket.io-client'
import User from '../../models/User'
import { io } from '../index'
import { where } from 'sequelize'
import Lobby from '@/models/Lobby'
const { Op } = require('sequelize')

//
export const findLobbyLeader = async (socket: any, code: string) => {
  const ll = await User.findOne({ where: { socket: socket.id } }).then(
    (user) => user?.lobbyLeader
  )

  socket.emit(
    'getLeader',
    await User.findOne({ where: { socket: socket.id } }).then(
      (user) => user?.lobbyLeader
    )
  )
}
//

async function getArrOfVotes(code: any) {
  const arr: string[][] = [[], []]

  await User.findAll({ where: { lobbyCode: code, voteNumber: 1 } }).then(
    (users) => {
      users.map((user) => arr[0].push(user.nick))
    }
  )
  await User.findAll({ where: { lobbyCode: code, voteNumber: 2 } }).then(
    (users) => {
      users.map((user) => arr[1].push(user.nick))
    }
  )
  return arr
}

function getRandomNumbers(n: number) {
  const numbers = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }
  return numbers
}

export const setNumbers = async (socket: any, code: string) => {
  const countOfUsers = User.findAll({ where: { lobbyCode: code } })
  const rundomArr = getRandomNumbers((await countOfUsers).length)
  countOfUsers.then((arr) => {
    arr.map(async (user) => {
      await User.update({ number: rundomArr.pop() }, { where: { id: user.id } })
    })
  })
}

export const startGameTimer = async (socket: any, code: string) => {
  const lobby = await Lobby.findOne({
    where: { lobbyCode: code },
  })
  const countOfRounds = lobby!.countOfRounds

  console.log(
    countOfRounds,
    'countOfRounds countOfRounds countOfRounds countOfRounds'
  )

  let roundNumber = 1
  let gameTimerValue = 5
  let gamePhase = 1
  let paused = false
  const countOfQuestions = await User.count({ where: { lobbyCode: code } })
  let newNumberOfQuestion = 0
  socket.on('togglePause', (code: string) => {
    console.log('emit changePause')
    paused = !paused
    console.log(paused)
    io.to(code).emit('changePause')
  })
  if (gameTimerValue === 5) {
    const intervalId = setInterval(async () => {
      if (!paused) {
        gameTimerValue -= 1
        if (gameTimerValue < 0 && gamePhase === 1) {
          await User.update(
            {
              firstAnswer: null,
              secondAnswer: null,
            },
            { where: { socket: socket.id } }
          )

          gameTimerValue = 10
          gamePhase = 2
        }
        if (gameTimerValue < 0 && gamePhase === 2) {
          gameTimerValue = 10
          gamePhase = 3
        }

        if (gameTimerValue < 0 && gamePhase === 3) {
          gameTimerValue = 10
          gamePhase = 4
        }
        if (gameTimerValue < 0 && gamePhase === 4) {
          gameTimerValue = 10
          gamePhase = 5
        }
        if (gameTimerValue === 10 && gamePhase === 5) {
          const arrOfVotes = await getArrOfVotes(code)

          const usersInLobby = (
            await User.findAll({ where: { lobbyCode: code } })
          ).length

          const firstAnswerNumber =
            newNumberOfQuestion - 2 <= 0
              ? usersInLobby - Math.abs(newNumberOfQuestion - 2)
              : newNumberOfQuestion - 2

          const secondAnswerNumber =
            newNumberOfQuestion - 1 <= 0
              ? usersInLobby - Math.abs(newNumberOfQuestion - 1)
              : newNumberOfQuestion - 1

          const firstUserScore =
            (await User.findOne({
              where: { lobbyCode: code, number: firstAnswerNumber },
            }).then((user) => user?.score)) || 0
          const secondUserScore =
            (await User.findOne({
              where: { lobbyCode: code, number: secondAnswerNumber },
            }).then((user) => user?.score)) || 0

          const scoresForFirstPlayer =
            firstUserScore + arrOfVotes[0].length * 100 * roundNumber
          // (roundNumber > 1 ? roundNumber * 0.5 : roundNumber)

          const scoresForSecondPlayer =
            secondUserScore + arrOfVotes[1].length * 100 * roundNumber
          // (roundNumber > 1 ? roundNumber * 0.5 : roundNumber)

          await User.update(
            { score: scoresForFirstPlayer },
            { where: { lobbyCode: code, number: firstAnswerNumber } }
          )
          await User.update(
            { score: scoresForSecondPlayer },
            { where: { lobbyCode: code, number: secondAnswerNumber } }
          )
          console.log('arr of votes:', arrOfVotes, arrOfVotes[0], arrOfVotes[1])
          console.log(
            'first user score old:',
            firstUserScore,
            'new:',
            scoresForFirstPlayer
          )
          console.log(
            'second user score old:',
            secondUserScore,
            'new:',
            scoresForSecondPlayer
          )
          io.to(code).emit('getArrOfVotes', arrOfVotes)
        }

        if (gameTimerValue < 0 && gamePhase === 5) {
          console.log(
            'вопрос номер:',
            newNumberOfQuestion,
            'всего вопросов',
            countOfQuestions,
            'номер раунда',
            roundNumber,
            'всего раундов',
            countOfRounds
          )
          console.log(
            newNumberOfQuestion === countOfQuestions &&
              roundNumber === countOfRounds,
            newNumberOfQuestion === countOfQuestions,
            roundNumber === countOfRounds
          )
          if (
            newNumberOfQuestion === countOfQuestions &&
            roundNumber === countOfRounds
          ) {
            gameTimerValue = 5
            gamePhase = 1
            console.log('timer cleared')
            clearInterval(intervalId)
            gameTimerValue = 0 // Сбрасываем таймер
          } else if (
            newNumberOfQuestion < countOfQuestions &&
            roundNumber <= countOfRounds
          ) {
            gameTimerValue = 10
            gamePhase = 4
          } else if (
            newNumberOfQuestion === countOfQuestions &&
            roundNumber <= countOfRounds
          ) {
            roundNumber++
            gameTimerValue = 5
            gamePhase = 1
            newNumberOfQuestion = 0
          }
        }
        if (gameTimerValue === 10 && gamePhase === 4) {
          newNumberOfQuestion++
          console.log('numberOfQuestion changed!')
          setTimeout(() => {}, 1000)
          io.to(code).emit('getNewNumberOfquestion', newNumberOfQuestion)
        }

        console.log(
          'time ticking',
          gameTimerValue,
          'number of question',
          newNumberOfQuestion,
          'game phase',
          gamePhase,
          'round now',
          roundNumber,
          'count of rounds',
          countOfRounds
        )
        io.to(code).emit('gameTimerUpdate', {
          gameTimerValue,
          gamePhase,
          paused,
          newNumberOfQuestion,
        }) // если socket.emit - то обновления у одного человека, если io - то во всех лобби :-)
      } else {
        io.to(code).emit('gameTimerUpdate', {
          gameTimerValue,
          gamePhase,
          // paused,
          newNumberOfQuestion,
        })
      }
    }, 1000)
  }
}

export const sendAnswers = async (
  socket: any,
  [firstAnswerr, secondAnswerr]: string[]
) => {
  User.update(
    { firstAnswer: firstAnswerr, secondAnswer: secondAnswerr },
    { where: { socket: socket.id } }
  )
}

export const getStragersQuestion = async (socket: any, [code, number]: any) => {
  await User.update({ voteNumber: null }, { where: { lobbyCode: code } })
  console.log('getStarngersQuestions')
  setTimeout(async () => {
    const countOfUsers = await User.count({ where: { lobbyCode: code } })
    const firstUserNumber =
      number - 2 <= 0 ? countOfUsers - Math.abs(number - 2) : number - 2
    const secondUserNumber =
      number - 1 <= 0 ? countOfUsers - Math.abs(number - 1) : number - 1

    const user = await User.findOne({ where: { socket: socket.id } })

    const canVote =
      user?.number !== firstUserNumber && user?.number !== secondUserNumber

    const userForQuestion = await User.findOne({
      where: { lobbyCode: code, number },
    })

    const question = userForQuestion?.question
    const ownerOfQuestion = userForQuestion?.nick

    const userForFirstStrangerAnswer = await User.findOne({
      where: { lobbyCode: code, number: firstUserNumber },
    })

    const firstStrangerAnswer = userForFirstStrangerAnswer?.firstAnswer
    const firstStrangersNick = userForFirstStrangerAnswer?.nick

    const userForSecondStrangerAnswer = await User.findOne({
      where: { lobbyCode: code, number: secondUserNumber },
    })

    const secondStrangerAnswer = userForSecondStrangerAnswer?.secondAnswer
    const secondStrangerNick = userForSecondStrangerAnswer?.nick

    console.log('stranger questions sended')
    const strangersAnswers = [
      [firstStrangerAnswer, firstStrangersNick],
      [secondStrangerAnswer, secondStrangerNick],
    ]

    socket.emit('takeStragersQuestion', [
      strangersAnswers,
      [question, ownerOfQuestion],
      canVote,
    ])
  }, 100)
}

export const getStragersAnswers = async (socket: any, code: string) => {}

export const sendQuestion = async (socket: any, [question, code]: string[]) => {
  await User.update({ question: question }, { where: { socket: socket.id } })

  const countOfPlayers = await User.count({ where: { lobbyCode: code } })

  setTimeout(async () => {
    const userNumber = await User.findOne({
      where: { socket: socket.id },
    })
    if (userNumber && userNumber.number) {
      const firstUserForQuestion = await User.findOne({
        where: {
          lobbyCode: code,
          number: (userNumber?.number % countOfPlayers) + 1,
        },
      })
      const secondUserForQuestion = await User.findOne({
        where: {
          lobbyCode: code,
          number: ((userNumber?.number + 1) % countOfPlayers) + 1,
        },
      })

      console.log(
        firstUserForQuestion?.question,
        firstUserForQuestion?.number,
        secondUserForQuestion?.question,
        secondUserForQuestion?.number,

        userNumber.number,
        socket.id,
        '------------вопросы'
      )
      socket.emit('getQuestions', [
        firstUserForQuestion?.question,
        secondUserForQuestion?.question,
      ])
    }
  }, 1000)
}

export const voteForAnswer = async (socket: any, answerNumber: number) => {
  console.log(socket.id, answerNumber)
  await User.update(
    { voteNumber: answerNumber },
    { where: { socket: socket.id } }
  )
}

export const getScores = async (socket: any, code: string) => {
  try {
    const users = await User.findAll({ where: { lobbyCode: code } })
    const scoresArray = users.map((user) => [user.nick, user.score]) // Формируем массив [имя, очки]

    socket.emit('scoresData', scoresArray) // Отправляем данные клиенту
  } catch (e) {
    console.log('ошибка -', e)
  }
}
