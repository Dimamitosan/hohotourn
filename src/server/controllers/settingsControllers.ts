import User from '../../models/User'
import Lobby from '../../models/Lobby'
import { io } from '../index'

export const userEnter = async (socket: any, [telegramId, nick]: any) => {
  const haveSocket = await User.findOne({ where: { telegramId } }).then(
    (user) => user?.socket
  )
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

  const disconectedUser = {
    ...(await User.findOne({ where: { socket: socket.id } }))?.dataValues,
  }

  try {
    const disconectedLobbyCode = disconectedUser.lobbyCode

    await User.update(
      {
        lobbyCode: null,
        lobbyLeader: null,
        question: null,
        number: null,
        voteNumber: null,
        socket: null,
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
  } catch (e) {}
}
