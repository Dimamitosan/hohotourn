import Lobby from '../../models/Lobby'
import User from '../../models/User'

import { io } from '../index'

const generateLobbyCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export const createLobby = async (
  socket: any,
  [countOfPlayers, countOfRounds]: number[]
) => {
  const code = generateLobbyCode()
  try {
    await Lobby.create({
      lobbyCode: code,
      gameStarted: false,
      maxPlayers: countOfPlayers,
      countOfRounds,
    })
    await User.update(
      { lobbyCode: code, lobbyLeader: true },
      { where: { socket: socket.id } }
    )
    socket.join(code)
    socket.emit('lobbyCreated', code)

    const playersInLobby = await User.findAll({ where: { lobbyCode: code } })
    const arrOfNicks = playersInLobby.map((user) => user.nick)

    io.to(code).emit('updatePlayers', arrOfNicks)
  } catch (e) {
    console.log(e)
  }
}

export const startTimer = async (socket: any, code: string) => {
  let timerValue = 5
  let cancel = false
  socket.on('toggleStart', (code: string) => {
    console.log('emit changePause')
    cancel = !cancel
    console.log(cancel)
    io.to(code).emit('cancelStart')
  })
  if (timerValue === 5) {
    const intervalId = setInterval(() => {
      if (!cancel) {
        timerValue--
        console.log('time ticking', timerValue)
        io.to(code).emit('timerUpdate', timerValue) // если socket.emit - то обновления у одного человека, если io - то во всех лобби :-)

        // Остановка таймера, когда он достигает 0
        if (timerValue <= 0) {
          console.log('timer cleared')
          clearInterval(intervalId)
          timerValue = 5 // Сбрасываем таймер
        }
      } else {
        clearInterval(intervalId)
        io.to(code).emit('timerUpdate', 5)
      }
    }, 1000)
  }
}

export const startGame = (socket: any, code: string) => {
  io.to(code).emit('startGame') // Уведомляем всех участников лобби
}

export const disconnect = async (socket: any) => {
  console.log('user disconnected', socket.id)
  const disconectedUser = {
    ...(await User.findOne({ where: { socket: socket.id } }))?.dataValues,
  }
  const disconectedLobbyCode = disconectedUser.lobbyCode

  await User.update(
    {
      lobbyCode: null,
      lobbyLeader: null,
      question: null,
      number: null,
      voteNumber: null,
      score: 0,
    },
    { where: { socket: socket.id } }
  )
  const playersInLobby = await User.findAll({
    where: { lobbyCode: disconectedLobbyCode },
  })

  const arrOfNicks = playersInLobby.map((user) => user.nick)

  if (
    (await User.findAll({
      where: { lobbyCode: disconectedLobbyCode },
    }).then((users) => users.length === 0)) &&
    disconectedLobbyCode
  ) {
    await Lobby.destroy({ where: { lobbyCode: disconectedLobbyCode } })
  } else {
    if (disconectedLobbyCode) {
      io.to(disconectedLobbyCode).emit('updatePlayers', arrOfNicks)
    }
  }
}
