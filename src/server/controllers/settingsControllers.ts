import User from '../../models/User'
import Lobby from '../../models/Lobby'
import { io } from '../index'

export const userEnter = async (socket: any, [telegramId, nick]: any) => {
  const user = await User.findOne({ where: { telegramId } }).then(
    (user) => user
  )
  if (!user) {
    try {
      await User.findOrCreate({
        where: { telegramId },
        defaults: { nick, coins: 0, score: 0 },
      })
      await User.update(
        {
          socket: socket.id,
          lobbyCode: null,
          lobbyLeader: null,
          score: 0,
          number: null,
          question: null,
          firstAnswer: null,
          secondAnswer: null,
          voteNumber: null,
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
        defaults: { nick, coins: 0, score: 0 },
      })
      await User.update(
        {
          socket: socket.id,
          lobbyCode: null,
          lobbyLeader: null,
          score: 0,
          number: null,
          question: null,
          firstAnswer: null,
          secondAnswer: null,
          voteNumber: null,
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

  try {
    const disconectedLobbyCode = await User.findOne({
      where: { socket: socket.id },
    }).then((user) => user!.lobbyCode)

    console.log('disconectedLobbyCode', disconectedLobbyCode)

    await User.update(
      {
        lobbyCode: null,
        lobbyLeader: null,
        question: null,
        number: null,
        voteNumber: null,
        socket: null,
        firstAnswer: null,
        secondAnswer: null,
        score: 0,
      },
      { where: { socket: socket.id } }
    )

    if (disconectedLobbyCode) {
      const countOfPlayers = await Lobby.findOne({
        where: { lobbyCode: disconectedLobbyCode },
      }).then((lobby) => lobby!.countOfPlayers)

      await Lobby.update(
        { countOfPlayers: countOfPlayers - 1 },
        { where: { lobbyCode: disconectedLobbyCode } }
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
  } catch (e) {}
}
