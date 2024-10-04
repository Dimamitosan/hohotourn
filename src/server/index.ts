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
        defaults: { nick, coins: 0, score: 0 },
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
      await Lobby.create({ lobbyCode: code, gameStarted: false })
      await User.update(
        { lobbyCode: code, lobbyLeader: true },
        { where: { socket: socket.id } }
      )
      socket.join(code)
    } catch (e) {
      console.log(e)
    }

    socket.join(code)
    socket.emit('lobbyCreated', code)

    const playersInLobby = await User.findAll({ where: { lobbyCode: code } })
    const arrOfNicks = playersInLobby.map((user) => user.nick)

    io.to(code).emit('updatePlayers', arrOfNicks)
  })

  socket.on('getScores', async (code) => {
    try {
      const users = await User.findAll({ where: { lobbyCode: code } })
      const scoresArray = users.map((user) => [user.nick, user.score]) // Формируем массив [имя, очки]
      socket.emit('scoresData', scoresArray) // Отправляем данные клиенту
    } catch (e) {
      console.log(e)
    }
  })

  socket.on('joinLobby', async (code) => {
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
        'findLobbyLeader',
        await User.findOne({ where: { socket: socket.id } }).then(
          (user) => user?.lobbyLeader
        )
      )
      const playersInLobby = await User.findAll({ where: { lobbyCode: code } })
      const arrOfNicks = playersInLobby.map((user) => user.nick)
      io.to(code).emit('updatePlayers', arrOfNicks)
    }
  })

  socket.on('startGame', (lobbyData) => {
    const { code } = lobbyData
    io.to(code).emit('startGame') // Уведомляем всех участников лобби
  })

  let timerValue = 2
  socket.emit('timerUpdate', timerValue)

  socket.on('startTimer', (code) => {
    if (timerValue === 2) {
      const intervalId = setInterval(() => {
        timerValue--
        io.to(code).emit('timerUpdate', timerValue) // если socket.emit - то обновления у одного человека, если io - то во всех лобби :-)

        // Остановка таймера, когда он достигает 0
        if (timerValue <= 0) {
          clearInterval(intervalId)
          timerValue = 2 // Сбрасываем таймер
        }
      }, 1000)
    }
  })

  socket.on('disconnect', async () => {
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
  })
})

httpServer.listen(3001, () => {
  console.log('Socket.IO server running at http://localhost:3001/')
})
