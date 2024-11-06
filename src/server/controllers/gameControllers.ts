import { Socket } from 'socket.io-client'
import User from '../../models/User'
import { io } from '../index'
import { where } from 'sequelize'
const { Op } = require('sequelize')

//
export const findLobbyLeader = async (socket: any, code: string) => {
  const ll = await User.findOne({ where: { socket: socket.id } }).then(
    (user) => user?.lobbyLeader
  )
  console.log(
    await User.findOne({ where: { socket: socket.id } }).then(
      (user) => user?.lobbyLeader
    ),
    '---------lobby leader',
    ll
  )
  socket.emit(
    'getLeader',
    await User.findOne({ where: { socket: socket.id } }).then(
      (user) => user?.lobbyLeader
    )
  )
}
//

// const playersInLobby = await User.findAll({ where: { lobbyCode: code } })
// const arrOfNicks = playersInLobby.map((user) => user.nick)

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
  let gameTimerValue = 5
  let gamePhase = 1
  let paused = false
  const countOfQuestions = await User.count({ where: { lobbyCode: code } })
  let newNumberOfQuestion = 0
  let cantChange = false

  if (gameTimerValue === 5) {
    const intervalId = setInterval(async () => {
      socket.on('togglePause', (code: string) => {
        console.log('emit changePause')
        paused = !paused
        console.log(paused)
        io.to(code).emit('changePause')
      })
      if (!paused) {
        gameTimerValue--
        if (gameTimerValue < 0 && gamePhase === 1) {
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
          console.log('голоса игроков аааааааааааааааааааааааааааааааааааааааа')
          console.log(arrOfVotes, 'массив с голосами')
          io.to(code).emit('getArrOfVotes', arrOfVotes)
        }
        if (gameTimerValue === 0 && gamePhase === 5) {
          if (newNumberOfQuestion < countOfQuestions) {
            gameTimerValue = 10
            gamePhase = 4
          } else {
            console.log('timer cleared')
            clearInterval(intervalId)
            gameTimerValue = 0 // Сбрасываем таймер
          }
        }
        if (gameTimerValue === 10 && gamePhase === 4) {
          newNumberOfQuestion++
          console.log('numberOfQuestion changed!')
          setTimeout(() => {}, 1000)
          io.to(code).emit('getNewNumberOfquestion', newNumberOfQuestion)
        }
        if (gameTimerValue !== 0) {
          cantChange = true
        }

        console.log(
          'time ticking',
          gameTimerValue,
          'number of question',
          newNumberOfQuestion,
          'game phase',
          gamePhase
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
          paused,
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
  console.log(firstAnswerr, secondAnswerr, socket.id)

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

    const userForFirstStrangerAnswer = await User.findOne({
      where: { lobbyCode: code, number: firstUserNumber },
    })

    const firstStrangerAnswer = userForFirstStrangerAnswer?.firstAnswer

    const userForSecondStrangerAnswer = await User.findOne({
      where: { lobbyCode: code, number: secondUserNumber },
    })

    const secondStrangerAnswer = userForSecondStrangerAnswer?.secondAnswer

    console.log('stranger questions sended')
    const strangersAnswers = [firstStrangerAnswer, secondStrangerAnswer]
    console.log(
      firstStrangerAnswer,
      secondStrangerAnswer,
      question,
      canVote,
      firstUserNumber,
      secondUserNumber
    )
    socket.emit('takeStragersQuestion', [strangersAnswers, question, canVote])
  }, 100)
}

export const getStragersAnswers = async (socket: any, code: string) => {}

export const sendQuestion = async (socket: any, [question, code]: string[]) => {
  await User.update({ question: question }, { where: { socket: socket.id } })

  const countOfPlayers = await User.count({ where: { lobbyCode: code } })
  const countOfReadyQuestions = await User.count({
    where: { lobbyCode: code, question: { [Op.ne]: null } },
  })
  // if (countOfReadyQuestions === countOfPlayers) {
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

  console.log(countOfPlayers, countOfReadyQuestions)
}

export const voteForAnswer = async (socket: any, answerNumber: number) => {
  console.log(socket.id, answerNumber)
  await User.update(
    { voteNumber: answerNumber },
    { where: { socket: socket.id } }
  )
  console.log(User.findOne({ where: { socket: socket.id } }))
  console.log('answerNumber-answerNumber-answerNumber-answerNumber')
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
