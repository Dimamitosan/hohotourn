import { Server } from 'socket.io'
import Lobby from '../../models/Lobby'
import User from '../../models/User'
import Sessions from '@/models/Sessions'
import { Socket } from 'socket.io-client'
import { io } from '../index'

export const joinLobby = async (socket: any, code: string) => {
  socket.join(code)
  if (await Lobby.findOne({ where: { lobbyCode: code } })) {
    console.log(socket.id, '- id of connecting user')
    const userId = await User.findOne({ where: { socket: socket.id } }).then(
      (user) => user!.id
    )
    const userNick = await User.findOne({ where: { socket: socket.id } }).then(
      (user) => user!.nick
    )

    if (!(await Sessions.findOne({ where: { userId, lobbyCode: code } }))) {
      try {
        await Sessions.create({
          userId,
          lobbyCode: code,
          lobbyLeader: false,
          score: 0,
          inGame: true,
          inRound: true,
        })
      } catch (e) {
        console.log('join control err')
      }
    } else if (
      await Sessions.findOne({
        where: { userId, lobbyCode: code, inGame: false },
      })
    ) {
      await Sessions.update(
        { inGame: true },
        { where: { userId, lobbyCode: code, inGame: false } }
      )
    }

    const userSession = await Sessions.findOne({
      where: { userId, lobbyCode: code },
    })

    socket.join(code)
    socket.emit('setLeader', userSession!.lobbyLeader)
    try {
      const countOfPlayers = await Lobby.findOne({
        where: { lobbyCode: code },
      }).then((lobby) => lobby!.countOfPlayers)
      await Lobby.update(
        { countOfPlayers: countOfPlayers + 1 },
        { where: { lobbyCode: code } }
      )
      const lobbyInfo = await Lobby?.findOne({ where: { lobbyCode: code } })
      const maxPlayers = lobbyInfo?.maxPlayers

      io.to(code).emit('updateLobbyInfo', maxPlayers)
    } catch (e) {
      console.log(e)
    }
    io.to(code).emit('playerConDiscon', `${userNick} - подключился к игре!`)
    const playersInLobby = await User.findAll({
      include: {
        model: Sessions,
        as: 'Sessions',
        where: { lobbyCode: code, inGame: true },
      },
    })
    const arrOfNicks = playersInLobby.map((user) => user.nick)

    console.log(arrOfNicks)

    io.to(code).emit('updatePlayers', arrOfNicks)
  }
}

export const checkLobbyIsFull = async (socket: any, code: string) => {
  console.log('checking')
  try {
    const lobby = await Lobby.findOne({ where: { lobbyCode: code } })
    const playersInlobby = await Lobby.findOne({
      where: { lobbyCode: code },
    }).then((lobby) => lobby!.countOfPlayers)
    if (!lobby) {
      socket.emit('lobbyStatus', 'Мы не нашли такого лобби(', false)
    } else {
      if (lobby!.gameStarted === true && lobby!.maxPlayers > playersInlobby) {
        socket.emit('lobbyStatus', 'Игра уже идет, заходи скорее! ', true, true)

        // socket.emit('lobbyStatus', 'Игра уже началась, зайти нельзя!', false)
      } else if (lobby!.maxPlayers > playersInlobby) {
        socket.emit('lobbyStatus', 'Мы тебя ждем, заходи скорее!', true)
      } else if (lobby!.maxPlayers === playersInlobby) {
        socket.emit('lobbyStatus', 'Это лобби уже заполнено!', false)
      }
    }
  } catch (e) {
    socket.emit('lobbyStatus', 'Мы не нашли такого лобби(', false)
    console.log(e)
  }
}
