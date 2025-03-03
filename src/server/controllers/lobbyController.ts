import { where } from 'sequelize'
import Lobby from '../../models/Lobby'
import User from '../../models/User'
import Sessions from '@/models/Sessions'
import sequelize from '@/config/db'

import { io } from '../index'

const generateLobbyCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export const createLobby = async (
  socket: any,
  [countOfPlayers, countOfRounds, isLobbyOpen]: [number, number, boolean]
) => {
  console.log('creating lobby ......')
  const code = generateLobbyCode()
  try {
    const userId = await User.findOne({ where: { socket: socket.id } }).then(
      (user) => user!.id
    )

    await Lobby.create({
      lobbyCode: code,
      gameStarted: false,
      maxPlayers: countOfPlayers,
      countOfRounds,
      usedQuestions: '',
      isOpen: isLobbyOpen,
      countOfPlayers: 0,
      numberOfQuestion: 0,
      isPaused: false,
    })
    console.log('lobby created....')

    try {
      await Sessions.create({
        userId: userId,
        lobbyCode: code,
        lobbyLeader: true,
        inGame: true,
        inRound: true,
        score: 0,
      })
    } catch (e) {
      console.log('lobby err')
    }

    socket.join(code)
    socket.emit('lobbyCreated', code)

    const playersInLobby = await User.findAll({
      include: { model: Sessions, as: 'Sessions', where: { lobbyCode: code } },
    })
    const arrOfNicks = playersInLobby.map((user) => user.nick)

    io.to(code).emit('updatePlayers', arrOfNicks)
  } catch (e) {
    console.log(e)
  }
}

export const quitFromLobby = async (socket: any, code: string) => {
  const quitSession = await Sessions.findOne({
    include: { model: User, as: 'User', where: { socket: socket.id } },
    where: { lobbyCode: code },
  })

  console.log(await Lobby.findOne({ where: { lobbyCode: code } }))

  const countOfPlayers = await Lobby.findOne({
    where: { lobbyCode: code },
  }).then((lobby) => lobby!.countOfPlayers)

  if (quitSession!.lobbyLeader && countOfPlayers > 1) {
    await quitSession!.destroy()
    socket.leave(code)
    const userIdOfNewLeader = await Sessions.findOne({
      where: { lobbyCode: code, inGame: true },
    }).then((session) => session!.userId)

    await Sessions.update(
      { lobbyLeader: true },
      { where: { userId: userIdOfNewLeader, lobbyCode: code } }
    )

    const socketOfNewLeader = await User.findOne({
      include: { model: Sessions, as: 'Sessions' },
      where: { id: userIdOfNewLeader },
    }).then((user) => user!.socket)

    socket.to(socketOfNewLeader).emit('setLeader', true)
  } else {
    await quitSession!.destroy()
    socket.leave(code)
  }

  const countOfPlayersInLobbyNow = await Sessions.count({
    where: { lobbyCode: code, inGame: true },
  })

  await Lobby.update(
    { countOfPlayers: countOfPlayersInLobbyNow },
    { where: { lobbyCode: code } }
  )

  const playersInLobby = await User.findAll({
    include: {
      model: Sessions,
      as: 'Sessions',
      where: { lobbyCode: code, inGame: true },
    },
  })
  const arrOfNicks = playersInLobby.map((user) => user.nick)
  console.log(arrOfNicks, 'nicks after leave')

  if (
    (await Lobby.findOne({
      where: { lobbyCode: code },
    }).then((lobby) => lobby!.countOfPlayers === 0)) &&
    code
  ) {
    await Lobby.destroy({ where: { lobbyCode: code } })
    await Sessions.destroy({ where: { lobbyCode: code } })
  } else {
    if (code) {
      io.to(code).emit('updatePlayers', arrOfNicks)
    }
  }
}

export const askGameExists = async (socket: any, code: string) => {
  console.log('qqqqqq', code)
  console.log(await Lobby.findOne({ where: { lobbyCode: code } }))
  const gameExists = await Lobby.findOne({ where: { lobbyCode: code } })

  if (!gameExists) {
    socket.emit('answerGameExists', false)
  }
}

// export const startTimer = async (socket: any, code: string) => {
//   let timerValue = 5
//   let cancel = false

//   // socket.off('toggleStart') ////

//   if (timerValue === 5) {
//     io.to(code).emit('timerStarted')
//     const intervalId = setInterval(() => {
//       socket.on('toggleStart', (code: string) => {
//         console.log('emit changePause')
//         cancel = !cancel
//         console.log(cancel)
//         clearInterval(intervalId)
//         io.to(code).emit('cancelStart')
//       })

//       if (!cancel) {
//         timerValue--
//         console.log('time ticking', timerValue)
//         io.to(code).emit('timerUpdate', timerValue) // если socket.emit - то обновления у одного человека, если io - то во всех лобби :-)

//         // Остановка таймера, когда он достигает 0
//         if (timerValue <= 0) {
//           console.log('timer cleared')
//           clearInterval(intervalId)
//           timerValue = 5 // Сбрасываем таймер
//         }
//       } else {
//         clearInterval(intervalId)
//         io.to(code).emit('timerUpdate', 5)
//       }
//     }, 1000)
//   }
// }

export const startTimer = async (socket: any, code: string) => {
  let timerValue = 5
  let cancel = false
  let intervalId: NodeJS.Timeout | null = null // Declare intervalId at a higher scope

  // Check if the timer is already running
  if (intervalId) {
    console.log('Timer already running, ignoring this start request.')
    return // Early return to prevent starting a new timer
  }

  io.to(code).emit('timerStarted') // Notify everyone that the timer has started
  intervalId = setInterval(() => {
    socket.on('toggleStart', (code: string) => {
      console.log('emit changePause')
      cancel = !cancel
      console.log('Cancel state toggled:', cancel)
      if (cancel) {
        clearInterval(intervalId!)
        intervalId = null // Clear the reference
        io.to(code).emit('cancelStart')
      } else {
        console.log('Timer resumed')
      }
    })

    if (!cancel) {
      timerValue--
      console.log('Time ticking:', timerValue)
      io.to(code).emit('timerUpdate', timerValue)

      if (timerValue <= 0) {
        console.log('Timer completed, clearing interval')
        clearInterval(intervalId!)
        intervalId = null // Clear the reference for the interval
        timerValue = 5 // Reset the timer value
      }
    } else {
      clearInterval(intervalId!)
      intervalId = null // Clear the reference
      io.to(code).emit('timerUpdate', 5)
    }
  }, 1000)
}

export const startGame = async (socket: any, code: string) => {
  // await Lobby.update({ gameStarted: true }, { where: { lobbyCode: code } })
  io.to(code).emit('startGame') // Уведомляем всех участников лобби
}
