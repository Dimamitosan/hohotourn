import { Server } from 'socket.io'
import { createServer } from 'http'
import sequelize from '../config/db'
import User from '../models/User'
import Lobby from '../models/Lobby'
sequelize.sync({}).then(() => {
  // force: true убрал
  console.log('Database & tables created!')
})

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
})

//bot
import TelegramBot from 'node-telegram-bot-api'
// import { USE } from 'sequelize/lib/index-hints'

const webAppUrl = 'https://client.ru.tuna.am'

const token = '6304629931:AAFq7J2ONfaq9j_co_vdQRWMY0eUfZJkK6E'

const bot = new TelegramBot(token, { polling: true })

bot.on('message', async (msg) => {
  // ПОМЕНЯТЬ ТИП msg

  const chatId = msg.chat.id
  const text = msg.text

  if (text === '/start') {
    await bot.sendMessage(chatId, 'Для игры нажмите кнопку ниже', {
      reply_markup: {
        inline_keyboard: [[{ text: 'играть', web_app: { url: webAppUrl } }]],
      },
    })
  }
  bot.sendMessage(chatId, 'Received your message')
})

//server

const generateLobbyCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id)

  socket.on('userEnter', async ([telegramId, nick]) => {
    try {
      await User.findOrCreate({
        where: { telegramId },
        defaults: { nick, coins: 0 },
      })
      await User.update(
        { socket: socket.id, lobbyCode: null },
        { where: { telegramId } }
      )
    } catch (e) {
      console.log(e)
    }
  })

  socket.on('createLobby', async () => {
    const code = generateLobbyCode()
    try {
      await Lobby.create({ lobbyCode: code })
      await User.update({ lobbyCode: code }, { where: { socket: socket.id } })
      console.log(await User.findOne({ where: { socket: socket.id } }))
      console.log('lobby created ', code, typeof code)
      console.log(await Lobby.findOne({ where: { lobbyCode: code } }))
      console.log(
        (await Lobby.findOne({ where: { lobbyCode: code } })) ? 'yes' : 'no'
      )
    } catch (e) {
      console.log(e)
    }

    socket.join(code)
    socket.emit('lobbyCreated', code)

    const playersInLobby = await User.findAll({ where: { lobbyCode: code } })
    const arrOfNicks = playersInLobby.map((user) => user.nick)

    io.to(code).emit('updatePlayers', arrOfNicks)
  })

  socket.on('joinLobby', async (code) => {
    console.log(code, typeof code)
    if (await Lobby.findOne({ where: { lobbyCode: code } })) {
      if (
        await User.findOne({
          where: { socket: socket.id, lobbyCode: null }, //, lobbyCode: null
        })
      ) {
        console.log('user finded!')
        await User.update({ lobbyCode: code }, { where: { socket: socket.id } })
      }
      socket.join(code)
      const playersInLobby = await User.findAll({ where: { lobbyCode: code } })
      const arrOfNicks = playersInLobby.map((user) => user.nick)
      io.to(code).emit('updatePlayers', arrOfNicks)
    }
  })

  socket.on('disconnect', async () => {
    console.log('user disconnected', socket.id)
    const disconectedUser = {
      ...(await User.findOne({ where: { socket: socket.id } }))?.dataValues,
    }
    const disconectedLobbyCode = disconectedUser.lobbyCode

    await User.update({ lobbyCode: null }, { where: { socket: socket.id } })
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
  })
})

httpServer.listen(3001, () => {
  console.log('Socket.IO server running at http://localhost:3001/')
})
