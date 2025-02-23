import User from '../../models/User'
import Lobby from '../../models/Lobby'
import Sessions from '@/models/Sessions'
import { io } from '../index'

import { eventEmitter } from '../index'

export const userEnter = async (socket: any, [telegramId, nick]: any) => {
  const user = await User.findOne({ where: { telegramId } }).then(
    (user) => user
  )
  if (!user) {
    try {
      await User.findOrCreate({
        where: { telegramId },
        defaults: { nick },
      })
      await User.update(
        {
          socket: socket.id,
        },
        { where: { telegramId } }
      )
    } catch (e) {
      console.log(e)
    }
  }

  const readyUser = await User.findOne({ where: { telegramId } }).then(
    (user) => user
  )

  const haveSocket = readyUser?.socket

  console.log(haveSocket, 'aaaaaaa', socket.id)

  if (haveSocket !== null && socket.id !== haveSocket) {
    socket.emit('endAnotherSession')
  } else {
    try {
      await User.findOrCreate({
        where: { telegramId },
        defaults: { nick },
      })
      await User.update(
        {
          socket: socket.id,
        },
        { where: { telegramId } }
      )
    } catch (e) {
      console.log(e)
    }
  }
}

export const disconnect = async (socket: any) => {
  console.log('user disconnected', socket.id)

  if (
    await Sessions.findOne({
      include: { model: User, as: 'User', where: { socket: socket.id } },
      where: { inGame: true, inRound: true },
    })
  ) {
    const code = await Sessions.findOne({
      include: { model: User, as: 'User', where: { socket: socket.id } },
      where: { inGame: true, inRound: true },
    }).then((session) => session!.lobbyCode)

    const userName = await User.findOne({ where: { socket: socket.id } }).then(
      (user) => user!.nick
    )

    const quitSession = await Sessions.findOne({
      include: { model: User, as: 'User', where: { socket: socket.id } },
      where: { lobbyCode: code },
    })

    await quitSession!.update({
      inGame: false,
      inRound: true,
    })

    socket.leave(code)

    io.to(code).emit('playerConDiscon', `${userName} - покинул игру.`)

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

    //await Lobby.findOne({
    //   where: { lobbyCode: code },
    // }).then((lobby) => lobby!.countOfPlayers === 0)

    if (arrOfNicks.length === 0 && code) {
      eventEmitter.emit('destroyTimer')
      console.log('destroyTimer!!!!')
      await Lobby.destroy({ where: { lobbyCode: code } })
      await Sessions.destroy({ where: { lobbyCode: code } })
    } else if (arrOfNicks.length === 2) {
      eventEmitter.emit('changeTwoPlayersOnly')
    } else {
      if (code) {
        io.to(code).emit('updatePlayers', arrOfNicks)
      }
    }
  }
  await User.update({ socket: null }, { where: { socket: socket.id } })
}
