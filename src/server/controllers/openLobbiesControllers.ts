import { Op, Sequelize } from 'sequelize'
import Lobby from '../../models/Lobby'
import User from '../../models/User'

export const loadLobbies = async (socket: any, page: number) => {
  const limit = 5
  const offset = page * limit

  const arrOfOpenLobbies = await Lobby.findAll({
    where: {
      gameStarted: false,
      isOpen: true,
      countOfPlayers: {
        [Op.lt]: Sequelize.col('maxPlayers'),
      },
    },
    limit: limit,
    offset: offset,
  })
  const filteredLobbies = arrOfOpenLobbies.filter(
    (lobby) => lobby.maxPlayers > lobby.countOfPlayers
  )

  const arrOfLobbies = filteredLobbies.map((lobby) => [
    lobby.lobbyCode,
    lobby.countOfPlayers,
    lobby.maxPlayers,
  ])

  console.log('loading lobbies', limit, offset, page)
  console.log(
    // 'arr -',
    // arrOfOpenLobbies,
    // 'filter -',
    // filteredLobbies,
    // 'end arr -',
    arrOfLobbies
  )
  socket.emit('lobbiesLoaded', arrOfLobbies)
}
