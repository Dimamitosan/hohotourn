import User from '../../models/User'

export const userEnter = async (socket: any, [telegramId, nick]: any) => {
  try {
    await User.findOrCreate({
      where: { telegramId },
      defaults: { nick, coins: 0, score: 0 },
    })
    await User.update(
      { socket: socket.id, lobbyCode: null },
      { where: { telegramId } }
    )
  } catch (e) {
    console.log(e)
  }
}
