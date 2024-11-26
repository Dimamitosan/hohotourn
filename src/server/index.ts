import { Server } from 'socket.io'
import { createServer } from 'http'
import User from '@/models/User'
import sequelize from '../config/db'
import {
  createLobby,
  startTimer,
  quitFromLobby,
  startGame,
} from './controllers/lobbyController'
import {
  sendQuestion,
  getScores,
  // setNumbers,
  findLobbyLeader,
  startGameTimer,
  sendAnswers,
  getStragersQuestion,
  voteForAnswer,
  requestRandomQuestion,
  requestQuestions,
} from './controllers/gameControllers'
import { joinLobby, checkLobbyIsFull } from './controllers/joinControllers'
import { userEnter, disconnect } from './controllers/settingsControllers'

sequelize.sync({}).then(() => {
  // force: true убрал
  console.log('Database & tables created!')
})

const httpServer = createServer()
export const io = new Server(httpServer, {
  pingTimeout: 80000, // максимальное время ожидания пинга в миллисекундах (по умолчанию 20000)
  pingInterval: 25000, // интервал пинга в миллисекундах (по умолчанию 25000)
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

  socket.on('sendQuestion', (question: string) =>
    sendQuestion(socket, question)
  )

  socket.on('getStragersQuestion', ([code, number]) => {
    getStragersQuestion(socket, [code, number])
  })

  socket.on('requestQuestions', (code) => {
    requestQuestions(socket, code)
  })
  // socket.on('setNumbers', (code) => {
  //   setNumbers(socket, code)
  // })
  socket.on('requestRandomQuestion', (code) => {
    requestRandomQuestion(socket, code)
  })

  socket.on('voteForAnswer', (answerNumber) => {
    voteForAnswer(socket, answerNumber)
  })

  socket.on('disconnect', () => disconnect(socket))
})

httpServer.listen(3001, () => {
  console.log('Socket.IO server running at http://localhost:3001/')
})

// Функция, которую вы хотите выполнить перед завершением
const cleanup = async () => {
  console.log('Выполняю очистку перед закрытием сервера...')
  try {
    await sequelize.authenticate() // Проверяем соединение
    console.log('Соединение с базой данных установлено успешно.')
    const [numberOfAffectedRows, affectedRows] = await User.update(
      { socket: null }, // Устанавливаем новое значение
      { where: {}, returning: true } // Параметр where пуст, поэтому будут обновлены все записи
    )
    console.log(`${numberOfAffectedRows} пользователей обновлено.`)
    console.log('Обновлённые записи:', affectedRows)
  } catch (e) {
    console.log(e)
  } finally {
    await sequelize.close() // Закрываем соединение
  }

  // Важно, чтобы вы завершили процесс после выполнения всех задач
  setTimeout(() => {
    console.log('Сервер закрыт. все сокеты пользователей стерты.')
    process.exit(0)
  }, 1000) // Задержка для завершения асинхронных задач, при необходимости
}

// Обработка сигнала SIGINT (обычно Ctrl+C в терминале)
process.on('SIGINT', () => {
  cleanup()
})

// Обработка сигнала SIGTERM (завершение процесса системным вызовом)
process.on('SIGTERM', () => {
  cleanup()
})
