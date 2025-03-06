import { Socket } from 'socket.io-client'
import User from '../../models/User'
import Sessions from '@/models/Sessions'
import { io } from '../index'
import { where } from 'sequelize'
import Lobby from '@/models/Lobby'
import arrOfQuestions from '../questions'

import { eventEmitter } from '../index'
//
export const findLobbyLeader = async (socket: any, code: string) => {
  // const ll = await User.findOne({ where: { socket: socket.id } }).then(
  //   (user) => user?.lobbyLeader
  // )

  // было getLeader, и в game page было get
  socket.emit(
    'setLeader',
    await Sessions.findOne({
      include: { model: User, as: 'User', where: { socket: socket.id } },
    }).then((user) => user?.lobbyLeader)
  )
}
//

export const askNewNumberOfquestion = async (socket: any, code: string) => {
  const number = await Lobby.findOne({ where: { lobbyCode: code } }).then(
    (lobby) => lobby!.numberOfQuestion
  )

  socket.emit('getNewNumberOfquestion', number)
}

export const deleteSession = async (socket: any, code: string) => {
  const userId = await User.findOne({ where: { socket: socket.id } }).then(
    (user) => user!.id
  )

  console.log(userId, 'fffffff')

  await Sessions.destroy({ where: { lobbyCode: code, userId: userId } })
}

export const askArrOfVotes = async (socket: any, code: any) => {
  const arr: string[][] = [[], []]

  await User.findAll({
    include: {
      model: Sessions,
      as: 'Sessions',
      where: { lobbyCode: code, voteNumber: 1 },
    },
  }).then((users) => {
    users.map((user) => arr[0].push(user.nick))
  })
  await User.findAll({
    include: {
      model: Sessions,
      as: 'Sessions',
      where: { lobbyCode: code, voteNumber: 2 },
    },
  }).then((users) => {
    users.map((user) => arr[1].push(user.nick))
  })
  // return arr
  socket.emit('getArrOfVotes', arr)
}

function shuffleArray(array: any[]): string[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const setNumbers = async (code: string) => {
  const players = await Sessions.findAll({
    where: {
      lobbyCode: code,
      inRound: true,
    },
  })

  const playersUserId = players.map((player) => player!.userId)

  const shuffledSockets = shuffleArray(playersUserId)

  shuffledSockets.map(async (randomId) => {
    await Sessions.update(
      { number: shuffledSockets.indexOf(randomId) + 1 },
      { where: { userId: randomId } }
    )
  })
}

const handleAskAboutPause = async (socket: any, paused: boolean) => {
  const session = await Sessions.findOne({
    include: [{ model: User, as: 'User', where: { socket: socket.id } }],
    where: { inGame: true, inRound: true },
  })
  const code = session!.lobbyCode
  if (code) {
    paused = await Lobby.findOne({ where: { lobbyCode: code } }).then(
      (lobby) => lobby!.isPaused
    )
  }
  console.log(code, ',kznm,kznm,kznm,kznm,kznm,kznm33333333333')

  socket.emit('answerAboutPause', paused)
}

export const startGameTimer = async (socket: any, code: string) => {
  console.log(code, ',kznm,kznm,kznm,kznm,kznm,kznm')

  let roundNumber = 1
  let gameTimerValue = 5
  let gamePhase = 1
  let paused = false
  let waiting = false
  let nextGamsePhase = 0
  let nextGameTimerValue = 0
  const timeForFirstPhase = 1 //5
  const timeForSecondPhase = 1 //60 10
  const timeForThirdPhase = 1 //90 10
  const timeForFourthPhase = 1 //15
  const timeForFifthPhase = 1 //10
  const waitingTime = 1 //10
  let isThereOnlyTwoPlayers = false

  let countOfQuestions = 0
  let newNumberOfQuestion = 0

  setupSocketListeners(socket, code, paused)
  const lobby = await Lobby.findOne({
    where: { lobbyCode: code },
  })
  const countOfRounds = lobby!.countOfRounds

  const eventChangeLeaderSocket = (newSocket: any) => {
    socket = newSocket
    setupSocketListeners(socket, code, paused)
    socket.emit('isPaused', paused)
  }

  const eventChangeTwoPlayersOnly = (isPlayersNotALot: boolean) => {
    isThereOnlyTwoPlayers = isPlayersNotALot
  }

  const eventDestroyTimer = (intervalId: any) => {
    clearInterval(intervalId)
  }

  eventEmitter.on('changeleaderSocket', (socket) =>
    eventChangeLeaderSocket(socket)
  )

  eventEmitter.on('changeTwoPlayersOnly', (isPlayersNotALot) => {
    eventChangeTwoPlayersOnly(isPlayersNotALot)
  })

  const handleTogglePause = async (code: string) => {
    //socket: any
    // console.log(socket, 'fffffffffasdsadadsa')
    // console.log(socket.id, 'aaaaaaaaaaaaaaa444444')
    // const session = await Sessions.findOne({
    //   include: [{ model: User, as: 'User', where: { socket: socket.id } }],
    //   where: { inGame: true, inRound: true },
    // })
    // const code = session!.lobbyCode
    //paused: boolean
    console.log(code, ',kznm,kznm,kznm,kznm,kznm,kznm222222222')
    console.log('emit changePause')
    // paused = !paused
    // if (code) {
    paused = await Lobby.findOne({ where: { lobbyCode: code } }).then(
      (lobby) => lobby!.isPaused
    )
    paused = !paused
    console.log(paused)
    io.to(code).emit('changePause', paused)
    await Lobby.update({ isPaused: paused }, { where: { lobbyCode: code } })
    // }
  }

  function setupSocketListeners(socket: any, code: string, paused: boolean) {
    socket.on('togglePause', async (code: string) => handleTogglePause(code)) //paused
    socket.on('askAboutPause', async () => handleAskAboutPause(socket, paused))
  }

  if (lobby!.gameStarted) return

  await Lobby.update({ gameStarted: true }, { where: { lobbyCode: code } })

  if (gameTimerValue === 5) {
    const intervalId = setInterval(async () => {
      // if (gameStates[code] !== undefined) {
      //   paused = gameStates[code].isPaused
      // } else {
      //   clearInterval(intervalId)
      // }
      eventEmitter.on('destroyTimer', () => {
        eventDestroyTimer(intervalId)
        eventEmitter.removeListener('destroyTimer', eventDestroyTimer)
        eventEmitter.removeListener(
          'changeleaderSocket',
          eventChangeLeaderSocket
        )
        eventEmitter.removeListener(
          'changeTwoPlayersOnly',
          eventChangeTwoPlayersOnly
        )
        return
      })

      // console.log(gameStates)
      if (!paused) {
        // console.log(io.sockets.adapter.rooms.get(code))

        if (isThereOnlyTwoPlayers) {
          io.to(code).emit('thereOnlyTwoPlayers')
          console.log(paused, !paused)
          console.log(
            'thereOnlyTwoPlayers Server Server Server Server Server Server'
          )
          paused = true
          io.to(code).emit('changePause', paused)
          await Lobby.update(
            { isPaused: paused },
            { where: { lobbyCode: code } }
          )
        }

        // if (
        //   gamePhase === 1 &&
        //   gameTimerValue === timeForFirstPhase &&
        //   isThereOnlyTwoPlayers
        // ) {
        //   io.to(code).emit('thereOnlyTwoPlayers')
        //   console.log(paused, !paused)
        //   console.log(
        //     'thereOnlyTwoPlayers Server Server Server Server Server Server'
        //   )
        //   paused = true
        //   io.to(code).emit('changePause', paused)
        //   await Lobby.update(
        //     { isPaused: paused },
        //     { where: { lobbyCode: code } }
        //   )
        // }

        gameTimerValue -= 1

        // const lobbyCountOfPlayers = (
        //   await Sessions.findAll({ where: { lobbyCode: code } })
        // ).length
        // if (lobbyCountOfPlayers === 0) {
        // await Lobby.destroy({ where: { lobbyCode: code } })
        // console.log('timer cleared')

        //   clearInterval(intervalId)
        // }

        if (gameTimerValue < 0 && gamePhase === 1) {
          // await Sessions.update(
          //   { inRound: false },
          //   { where: { inGame: false } }
          // )
          // await Sessions.update({ inRound: true }, { where: { inGame: true } })

          // const lobbyCountOfPlayers = (
          //   await Sessions.findAll({ where: { lobbyCode: code } })
          // ).length
          // console.log(lobbyCountOfPlayers, 'aaaaaaaaaaaaaa count')
          // if (lobbyCountOfPlayers === 0) {
          //   await Lobby.destroy({ where: { lobbyCode: code } })

          //   console.log('timer cleared')
          //   clearInterval(intervalId)
          // }

          countOfQuestions = await Sessions.count({
            where: { lobbyCode: code, inRound: true },
          })

          await Sessions.update(
            {
              number: null,
              question: null,
              firstAnswer: null,
              secondAnswer: null,
            },
            { where: { lobbyCode: code } }
          )

          gameTimerValue = timeForSecondPhase
          gamePhase = 2
          waiting = true ///////
        }
        if (gameTimerValue < 0 && gamePhase === 2) {
          await Sessions.update(
            { inRound: false },
            { where: { inGame: false } }
          )
          await Sessions.update({ inRound: true }, { where: { inGame: true } })

          setNumbers(code)
          gameTimerValue = timeForThirdPhase
          gamePhase = 3
          waiting = true ///////
        }

        if (gameTimerValue < 0 && gamePhase === 3) {
          gameTimerValue = timeForFourthPhase
          gamePhase = 4
          waiting = true ///////
        }

        if (gameTimerValue < 0 && gamePhase === 4) {
          gameTimerValue = timeForFifthPhase
          gamePhase = 5
        }

        if (gameTimerValue === timeForFifthPhase && gamePhase === 5) {
          // const arrOfVotes = await getArrOfVotes(code)
          const countOfFirstVote = await Sessions.count({
            where: { lobbyCode: code, voteNumber: 1 },
          })
          const countOfSecondVote = await Sessions.count({
            where: { lobbyCode: code, voteNumber: 2 },
          })
          const usersInLobby = (
            await Sessions.findAll({
              where: { lobbyCode: code, inRound: true },
            })
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
            (await Sessions.findOne({
              where: { lobbyCode: code, number: firstAnswerNumber },
            }).then((user) => user?.score)) || 0
          const secondUserScore =
            (await Sessions.findOne({
              where: { lobbyCode: code, number: secondAnswerNumber },
            }).then((user) => user?.score)) || 0

          const scoresForFirstPlayer =
            firstUserScore + countOfFirstVote * 100 * roundNumber

          const scoresForSecondPlayer =
            secondUserScore + countOfSecondVote * 100 * roundNumber

          await Sessions.update(
            { score: scoresForFirstPlayer },
            { where: { lobbyCode: code, number: firstAnswerNumber } }
          )
          await Sessions.update(
            { score: scoresForSecondPlayer },
            { where: { lobbyCode: code, number: secondAnswerNumber } }
          )
        }

        if (gameTimerValue < 0 && gamePhase === 5) {
          await Sessions.update(
            { voteNumber: null },
            { where: { lobbyCode: code } }
          )
          if (
            newNumberOfQuestion === countOfQuestions &&
            roundNumber === countOfRounds
          ) {
            gameTimerValue = timeForFirstPhase
            gamePhase = 1
            console.log('timer cleared Game ended')
            io.to(code).emit('gameEnded')
            clearInterval(intervalId)
            eventEmitter.removeListener('destroyTimer', eventDestroyTimer)
            eventEmitter.removeListener(
              'changeleaderSocket',
              eventChangeLeaderSocket
            )
            eventEmitter.removeListener(
              'changeTwoPlayersOnly',
              eventChangeTwoPlayersOnly
            )

            io.to(code).emit('gameTimerUpdate', {
              gameTimerValue,
              gamePhase,

              newNumberOfQuestion,
            })
            await Lobby.destroy({ where: { lobbyCode: code } })
            return

            // socket.off('togglePause', handleTogglePause)
            // socket.off('askAboutPause', handleAskAboutPause)
            return
          } else if (
            newNumberOfQuestion < countOfQuestions &&
            roundNumber <= countOfRounds
          ) {
            gameTimerValue = timeForFourthPhase
            gamePhase = 4
          } else if (
            newNumberOfQuestion === countOfQuestions &&
            roundNumber <= countOfRounds
          ) {
            roundNumber++
            gameTimerValue = timeForFirstPhase
            gamePhase = 1
            newNumberOfQuestion = 0
            waiting = true ///////
          }
        }
        if (gameTimerValue === timeForFourthPhase && gamePhase === 4) {
          newNumberOfQuestion++
          await Lobby.update(
            { numberOfQuestion: newNumberOfQuestion },
            { where: { lobbyCode: code } }
          )
          // console.log('numberOfQuestion changed!')
          // setTimeout(() => {}, 1000)
          // io.to(code).emit('getNewNumberOfquestion', newNumberOfQuestion)
        }
        if (waiting === true) {
          if (nextGamsePhase === 0 && nextGameTimerValue === 0) {
            nextGamsePhase = gamePhase
            nextGameTimerValue = gameTimerValue
            // gamePhase = 0
            gamePhase = gamePhase * -10
            gameTimerValue = waitingTime
          }

          if (gameTimerValue === 0) {
            waiting = false
            gamePhase = nextGamsePhase
            gameTimerValue = nextGameTimerValue
            nextGamsePhase = 0
            nextGameTimerValue = 0
          }
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
          // paused,
          newNumberOfQuestion,
        }) // если socket.emit - то обновления у одного человека, если io - то во всех лобби :-)
      } else {
        io.to(code).emit('gameTimerUpdate', {
          gameTimerValue,
          gamePhase,

          newNumberOfQuestion,
        })
      }
    }, 1000)
  }
}

export const askGameStarted = async (socket: any, code: string) => {
  // console.log(
  //   `Checking if game started for lobby code: ${code}......................................`
  // )
  const lobby = await Lobby.findOne({ where: { lobbyCode: code } })

  const isStarted = lobby!.gameStarted

  // console.log(
  //   lobby,
  //   isStarted,
  //   'isStartedisStartedisStartedisStartedisStartedisStartedisStartedisStartedisStarted.............................................'
  // )
  socket.emit('isGameStarted', isStarted)
}

export const sendAnswers = async (
  socket: any,
  [firstAnswerr, secondAnswerr]: string[]
) => {
  User.findOne({ where: { socket: socket.id } }).then(
    async (user) =>
      await Sessions.update(
        { firstAnswer: firstAnswerr, secondAnswer: secondAnswerr },
        { where: { userId: user!.id } }
      )
  )
}

export const getStragersQuestion = async (socket: any, [code, number]: any) => {
  console.log('getStarngersQuestions')
  setTimeout(async () => {
    const countOfUsers = await Sessions.count({
      where: { inRound: true, lobbyCode: code },
    })
    const firstUserNumber =
      number - 2 <= 0 ? countOfUsers - Math.abs(number - 2) : number - 2
    const secondUserNumber =
      number - 1 <= 0 ? countOfUsers - Math.abs(number - 1) : number - 1

    const user = await Sessions.findOne({
      include: { model: User, as: 'User', where: { socket: socket.id } },
    })

    const canVote =
      user?.number !== firstUserNumber && user?.number !== secondUserNumber

    const ownerOfQuestion = await User.findOne({
      include: {
        model: Sessions,
        as: 'Sessions',
        where: { lobbyCode: code, number },
      },
    }).then((user) => user!.nick)

    const question = await Sessions.findOne({
      where: { lobbyCode: code, number },
    }).then((session) => session!.question)

    // const question = userForQuestion.question
    // const ownerOfQuestion = userForNick?.nick

    const firstStrangersNick = await User.findOne({
      include: {
        model: Sessions,
        as: 'Sessions',
        where: { lobbyCode: code, number: firstUserNumber },
      },
    }).then((user) => user!.nick)

    const firstStrangerAnswer = await Sessions.findOne({
      where: { lobbyCode: code, number: firstUserNumber },
    }).then((session) => session!.secondAnswer)

    // const userForFirstStrangerAnswer = await User.findOne({
    //   where: { lobbyCode: code, number: firstUserNumber },
    // })

    // const firstStrangerAnswer = userForFirstStrangerAnswer?.secondAnswer
    // const firstStrangersNick = userForFirstStrangerAnswer?.nick

    const secondStrangerNick = await User.findOne({
      include: {
        model: Sessions,
        as: 'Sessions',
        where: { lobbyCode: code, number: secondUserNumber },
      },
    }).then((user) => user!.nick)

    const secondStrangerAnswer = await Sessions.findOne({
      where: { lobbyCode: code, number: secondUserNumber },
    }).then((session) => session!.firstAnswer)

    // const userForSecondStrangerAnswer = await User.findOne({
    //   where: { lobbyCode: code, number: secondUserNumber },
    // })

    // const secondStrangerAnswer = userForSecondStrangerAnswer?.firstAnswer
    // const secondStrangerNick = userForSecondStrangerAnswer?.nick

    const strangersAnswers = [
      [firstStrangerAnswer, firstStrangersNick],
      [secondStrangerAnswer, secondStrangerNick],
    ]
    console.log(
      'get starangers question and answers:',
      firstStrangerAnswer,
      firstUserNumber,
      secondStrangerAnswer,
      secondUserNumber,
      number
    )
    socket.emit('takeStragersQuestion', [
      strangersAnswers,
      [question, ownerOfQuestion],
      canVote,
    ])
  }, 100)
}

export const sendQuestion = async (socket: any, question: string) => {
  const userId = await User.findOne({ where: { socket: socket.id } }).then(
    (user) => user!.id
  )
  await Sessions.update({ question: question }, { where: { userId } })
}

export const requestQuestions = async (socket: any, code: string) => {
  const countOfPlayers = await Sessions.count({
    where: { inRound: true, lobbyCode: code },
  })

  const userNumber = await Sessions.findOne({
    include: { model: User, as: 'User', where: { socket: socket.id } },
  })
  if (userNumber && userNumber.number) {
    const firstUserForQuestion = await Sessions.findOne({
      where: {
        lobbyCode: code,
        number: (userNumber?.number % countOfPlayers) + 1,
      },
    })
    const secondUserForQuestion = await Sessions.findOne({
      where: {
        lobbyCode: code,
        number: ((userNumber?.number + 1) % countOfPlayers) + 1,
      },
    })
    socket.emit('getQuestions', [
      firstUserForQuestion?.question,
      secondUserForQuestion?.question,
    ])
  }
}

export const voteForAnswer = async (socket: any, answerNumber: number) => {
  // console.log(socket.id, answerNumber)

  const userId = await User.findOne({ where: { socket: socket.id } }).then(
    (user) => user!.id
  )

  await Sessions.update(
    { voteNumber: answerNumber },
    { where: { userId: userId } }
  )
}

export const getScores = async (socket: any, code: string) => {
  try {
    const players = (await Sessions.findAll({
      where: { lobbyCode: code, inGame: true },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['nick'],
        },
      ],
      attributes: ['score'],
    })) as any //as Array<SessionWithUser> // Явное приведение типа

    const scoresArray = players.map((player: any) => [
      player.User.nick,
      player.score,
    ])

    console.log(scoresArray, 'scores array')

    socket.emit('scoresData', scoresArray) // Отправляем данные клиенту
  } catch (e) {
    console.log('ошибка -', e)
  }
}

export const requestRandomQuestion = async (socket: any, code: string) => {
  const prevQuestions = await Lobby.findOne({
    where: { lobbyCode: code },
  }).then((lobby) => lobby?.usedQuestions)
  // console.log(prevQuestions)
  // console.log(0, arrOfQuestions[0])
  if (prevQuestions!.split(',').length - 1 >= arrOfQuestions.length) {
    socket.emit('getRandomQuestion', 'Вопросы кончились :-(')
  } else {
    let questionId
    do {
      questionId = Math.floor(Math.random() * arrOfQuestions.length)
    } while (prevQuestions!.includes(`${questionId}, `))
    const newUsedQuestions = `${prevQuestions}${questionId}, `
    await Lobby.update(
      { usedQuestions: newUsedQuestions },
      { where: { lobbyCode: code } }
    )

    const newQuestion = arrOfQuestions[questionId]
    socket.emit('getRandomQuestion', newQuestion)
  }
}
