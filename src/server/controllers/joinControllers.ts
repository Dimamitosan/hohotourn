import { Server } from 'socket.io'
import Lobby from '../../models/Lobby'
import User from '../../models/User'
import { Socket } from 'socket.io-client'
import { io } from '../index'

export const joinLobby = async (socket: any, code: string) => {
  socket.join(code)
  if (await Lobby.findOne({ where: { lobbyCode: code } })) {
    if (
      await User.findOne({
        where: { socket: socket.id, lobbyCode: null }, //, lobbyCode: null
      })
    ) {
      console.log('user finded!')
      await User.update(
        { lobbyCode: code, lobbyLeader: false },
        { where: { socket: socket.id } }
      )
    }
    socket.join(code)
    socket.emit(
      'setLeader',
      await User.findOne({ where: { socket: socket.id } }).then(
        (user) => user?.lobbyLeader
      )
    )
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

    const playersInLobby = await User.findAll({ where: { lobbyCode: code } })
    const arrOfNicks = playersInLobby.map((user) => user.nick)

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
      if (lobby!.gameStarted === true) {
        socket.emit('lobbyStatus', 'Игра уже началась, зайти нельзя!', false)
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
