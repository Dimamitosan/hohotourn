import { where } from 'sequelize'
import Lobby from '../../models/Lobby'
import User from '../../models/User'

import { io } from '../index'

const generateLobbyCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export const createLobby = async (
  socket: any,
  [countOfPlayers, countOfRounds, isLobbyOpen]: [number, number, boolean]
) => {
  const code = generateLobbyCode()
  try {
    await Lobby.create({
      lobbyCode: code,
      gameStarted: false,
      maxPlayers: countOfPlayers,
      countOfRounds,
      usedQuestions: '',
      isOpen: isLobbyOpen,
      countOfPlayers: 0,
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

export const quitFromLobby = async (socket: any, code: string) => {
  await User.update(
    { lobbyCode: null, lobbyLeader: null },
    { where: { socket: socket.id } }
  )
  const countOfPlayers = await Lobby.findOne({
    where: { lobbyCode: code },
  }).then((lobby) => lobby!.countOfPlayers)

  await Lobby.update(
    { countOfPlayers: countOfPlayers - 1 },
    { where: { lobbyCode: code } }
  )

  const playersInLobby = await User.findAll({
    where: { lobbyCode: code },
  })

  const arrOfNicks = playersInLobby.map((user) => user.nick)

  if (
    (await User.findAll({
      where: { lobbyCode: code },
    }).then((users) => users.length === 0)) &&
    code
  ) {
    await Lobby.destroy({ where: { lobbyCode: code } })
  } else {
    if (code) {
      io.to(code).emit('updatePlayers', arrOfNicks)
    }
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
    io.to(code).emit('timerStarted')
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

export const startGame = async (socket: any, code: string) => {
  await Lobby.update({ gameStarted: true }, { where: { lobbyCode: code } })
  io.to(code).emit('startGame') // Уведомляем всех участников лобби
}
