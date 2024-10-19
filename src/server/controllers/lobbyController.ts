import Lobby from '../../models/Lobby'
import User from '../../models/User'

import { io } from '../index'

const generateLobbyCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export const createLobby = async (socket: any, countOfPlayers: number) => {
  const code = generateLobbyCode()
  try {
    await Lobby.create({
      lobbyCode: code,
      gameStarted: false,
      maxPlayers: countOfPlayers,
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

export let timerValue = 5

export const timerUpdate = (socket: any) => {
  socket.emit('timerUpdate', timerValue)
}

export const startTimer = (socket: any, code: string) => {
  if (timerValue === 5) {
    const intervalId = setInterval(() => {
      timerValue--
      console.log('time ticking', timerValue)
      io.to(code).emit('timerUpdate', timerValue) // если socket.emit - то обновления у одного человека, если io - то во всех лобби :-)

      // Остановка таймера, когда он достигает 0
      if (timerValue <= 0) {
        console.log('timer cleared')
        clearInterval(intervalId)
        timerValue = 5 // Сбрасываем таймер
      }
    }, 1000)
  }
}

export const startGame = (socket: any, code: string) => {
  io.to(code).emit('startGame') // Уведомляем всех участников лобби
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

export const disconnect = async (socket: any) => {
  console.log('user disconnected', socket.id)
  const disconectedUser = {
    ...(await User.findOne({ where: { socket: socket.id } }))?.dataValues,
  }
  const disconectedLobbyCode = disconectedUser.lobbyCode

  await User.update(
    { lobbyCode: null, lobbyLeader: null },
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
