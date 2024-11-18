import { Server } from 'socket.io'
import { createServer } from 'http'
import sequelize from '../config/db'
import {
  createLobby,
  startTimer,
  disconnect,
  quitFromLobby,
  startGame,
} from './controllers/lobbyController'
import {
  sendQuestion,
  getScores,
  setNumbers,
  findLobbyLeader,
  startGameTimer,
  sendAnswers,
  getStragersQuestion,
  voteForAnswer,
} from './controllers/gameControllers'
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
  socket.setMaxListeners(100)

  console.log('a user connected', socket.id)

  socket.on('userEnter', ([telegramId, nick]) =>
    userEnter(socket, [telegramId, nick])
  )

  socket.on('createLobby', (countOfPlayers) =>
    createLobby(socket, countOfPlayers)
  )
  socket.on('quitFromLobby', (code) => quitFromLobby(socket, code))
  socket.on('joinLobby', (code) => joinLobby(socket, code))

  socket.on('startTimer', (code) => startTimer(socket, code))

  socket.on('startGame', (code) => startGame(socket, code))

  socket.on('getScores', (code) => getScores(socket, code))

  socket.on('findLobbyLeader', (code) => {
    findLobbyLeader(socket, code)
  })

  socket.on('sendAnswers', ([firstAnswer, secondAnswer]: string[]) => {
    sendAnswers(socket, [firstAnswer, secondAnswer])
  })

  socket.on('checkLobbyIsFull', (code) => checkLobbyIsFull(socket, code))

  socket.on('startGameTimer', (code) => {
    startGameTimer(socket, code)
  })

  socket.on('sendQuestion', ([question, code]: string[]) =>
    sendQuestion(socket, [question, code])
  )

  socket.on('getStragersQuestion', ([code, number]) => {
    getStragersQuestion(socket, [code, number])
  })

  socket.on('setNumbers', (code) => {
    setNumbers(socket, code)
  })

  socket.on('voteForAnswer', (answerNumber) => {
    voteForAnswer(socket, answerNumber)
  })

  socket.on('disconnect', () => disconnect(socket))
})

httpServer.listen(3001, () => {
  console.log('Socket.IO server running at http://localhost:3001/')
})
