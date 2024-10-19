import { Server } from 'socket.io'
import { createServer } from 'http'
import sequelize from '../config/db'
import {
  createLobby,
  getScores,
  startTimer,
  disconnect,
  timerValue,
  startGame,
} from './controllers/lobbyController'
import { sendQuestion } from './controllers/gameControllers'
import { joinLobby, checkLobbyIsFull } from './controllers/joinControllers'
import { userEnter } from './controllers/settingsControllers'

sequelize.sync({}).then(() => {
  // force: true убрал
  console.log('Database & tables created!')
})

const httpServer = createServer()
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
})

//server

io.on('connection', (socket) => {
  console.log('a user connected', socket.id)

  socket.on('userEnter', ([telegramId, nick]) =>
    userEnter(socket, [telegramId, nick])
  )

  socket.on('createLobby', (countOfPlayers) =>
    createLobby(socket, countOfPlayers)
  )

  socket.on('joinLobby', (code) => joinLobby(socket, code))

  socket.on('startTimer', (code) => startTimer(socket, code))

  socket.on('startGame', (code) => startGame(socket, code))

  socket.emit('timerUpdate', timerValue)

  socket.on('getScores', (code) => getScores(socket, code))

  socket.on('checkLobbyIsFull', (code) => checkLobbyIsFull(socket, code))

  socket.on('togglePause', (code) => {
    console.log('emit changePause')
    io.to(code).emit('changePause')
  })

  socket.on('sendQuestion', ([code, question]) =>
    sendQuestion(socket, [code, question])
  )

  socket.on('disconnect', () => disconnect(socket))
})

httpServer.listen(3001, () => {
  console.log('Socket.IO server running at http://localhost:3001/')
})
