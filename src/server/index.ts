import { Server } from 'socket.io'
import { createServer } from 'http'
import sequelize from '../config/db'
import {
  createLobby,
  startTimer,
  disconnect,
  // timerValue,
  startGame,
} from './controllers/lobbyController'
import {
  sendQuestion,
  getScores,
  setNumbers,
  findLobbyLeader,
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
  socket.setMaxListeners(20)

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

  socket.on('getScores', (code) => getScores(socket, code))

  socket.on('findLobbyLeader', (code) => {
    findLobbyLeader(socket, code)
  })

  socket.on('checkLobbyIsFull', (code) => checkLobbyIsFull(socket, code))

  let gameTimerValue = 5
  let gamePhase = 1
  let paused = false

  socket.on('startGameTimer', (code) => {
    console.log('wtf')
    if (gameTimerValue === 5) {
      const intervalId = setInterval(() => {
        socket.on('togglePause', (code) => {
          console.log('emit changePause')
          paused = !paused
          console.log(paused)
          io.to(code).emit('changePause')
        })
        if (!paused) {
          gameTimerValue--
          if (gameTimerValue < 0 && gamePhase === 1) {
            gameTimerValue = 5
            gamePhase = 2
          }
          if (gameTimerValue < 0 && gamePhase === 2) {
            gameTimerValue = 5
            gamePhase = 3
          }

          if (gameTimerValue <= 0 && gamePhase === 3) {
            console.log('timer cleared')
            clearInterval(intervalId)
            gameTimerValue = 0 // Сбрасываем таймер
          }
          console.log('time ticking', gameTimerValue)
          io.to(code).emit('gameTimerUpdate', {
            gameTimerValue,
            gamePhase,
            paused,
          }) // если socket.emit - то обновления у одного человека, если io - то во всех лобби :-)
        } else {
          io.to(code).emit('gameTimerUpdate', {
            gameTimerValue,
            gamePhase,
            paused,
          })
        }
      }, 1000)
    }
  })

  socket.on('sendQuestion', ([question, code]: string[]) =>
    sendQuestion(socket, [question, code])
  )

  socket.on('setNumbers', (code) => {
    setNumbers(socket, code)
  })

  socket.on('disconnect', () => disconnect(socket))
})

httpServer.listen(3001, () => {
  console.log('Socket.IO server running at http://localhost:3001/')
})
