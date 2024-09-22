import { Server } from 'socket.io'
import { createServer } from 'http'
import sequelize from '../config/db'
import User from '../models/User'
sequelize.sync({ force: true }).then(() => {
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

type Lobby = {
  code: string
  players: string[]
}

const lobbies: { [key: string]: Lobby } = {}

const generateLobbyCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id)

  // await User.findOne({where:{telegramId:id}})

  socket.on('userEnter', async ([id, nick]) => {
    try {
      await User.create({ telegramId: id, nick, coins: 0 })
    } catch (e) {
      console.log(e)
    }
  })

  // socket.on('createLobby', () => {
  //   const code = generateLobbyCode()
  //   lobbies[code] = { code, players: [socket.id] }

  //   socket.join(code)
  //   console.log(`join to ${code}`)
  //   console.log(lobbies[code])
  //   socket.emit('lobbyCreated', code)
  //   io.to(code).emit('updatePlayers', lobbies[code].players)
  // })
  socket.on('createLobby', () => {
    const code = generateLobbyCode() // Generate the lobby code
    lobbies[code] = { code, players: [socket.id] } // Add the lobby to memory with one socket ID

    socket.join(code) // Join the lobby
    socket.emit('lobbyCreated', code) // Send the lobby code back to the client

    // Emit the player list to all clients in the lobby
    io.to(code).emit('updatePlayers', lobbies[code].players)
  })

  socket.on('joinLobby', (code) => {
    if (lobbies[code]) {
      // Only add the socket if it is not already in the players list
      if (!lobbies[code].players.includes(socket.id)) {
        lobbies[code].players.push(socket.id)
      }
      socket.join(code)
      io.to(code).emit('updatePlayers', lobbies[code].players) // Emit player updates
    }
  })

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id)
    for (const code in lobbies) {
      const lobby = lobbies[code]
      const index = lobby.players.indexOf(socket.id)
      if (index !== -1) {
        lobby.players.splice(index, 1)
        io.to(code).emit('updatePlayers', lobby.players)

        if (lobby.players.length === 0) {
          delete lobbies[code]
        }
      }
    }
  })
})

httpServer.listen(3001, () => {
  console.log('Socket.IO server running at http://localhost:3001/')
})
