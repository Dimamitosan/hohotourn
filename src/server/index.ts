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
import { loadLobbies } from './controllers/openLobbiesControllers'

import bot from './bot/telegramBot'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const webAppUrl = process.env.WEBAPPURL

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

bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text

  if (text === '/start') {
    if (webAppUrl) {
      await bot.sendMessage(chatId, 'Для игры нажмите кнопку ниже', {
        reply_markup: {
          inline_keyboard: [[{ text: 'играть', web_app: { url: webAppUrl } }]],
        },
      })
    }
  }
  if (text === '/rules') {
    if (webAppUrl) {
      await bot.sendMessage(
        chatId,
        `Как играть? \n1 - Создайте лобби или подключитесь к уже существующему по коду\n2 - Дождитесь начала игры (для игры нужно минимум 3 игрока)\n3 - Введите шуточный вопрос (или используйте случайный вопрос из уже заготовленных) \nЭтот вопрос получат 2 игрока и им надо будет на него ответить\n4 - Ответьте в шуточной форме на два вопроса от других игроков\n5 - Голосуйте за лучший ответ!`
      )
    }
  }
  if (text === '/form') {
    if (webAppUrl) {
      await bot.sendMessage(
        chatId,
        `Если у вас вылезла ошибка, или есть предложения по улучшению игры\nВы можете заполнить форму по ссылке - https://forms.yandex.ru/u/67466767d046881f6de9857e/`
      )
    }
  }
})

io.on('connection', (socket) => {
  socket.setMaxListeners(100)

  console.log('a user connected', socket.id)

  socket.on('userEnter', ([telegramId, nick]: [number, string]) =>
    userEnter(socket, [telegramId, nick])
  )

  socket.on('loadLobbies', (page: number) => {
    loadLobbies(socket, page)
  })

  socket.on('createLobby', (countOfPlayersAndOpen: [number, number, boolean]) =>
    createLobby(socket, countOfPlayersAndOpen)
  )
  socket.on('quitFromLobby', (code: string) => quitFromLobby(socket, code))
  socket.on('joinLobby', (code: string) => joinLobby(socket, code))

  socket.on('startTimer', (code: string) => startTimer(socket, code))

  socket.on('startGame', (code: string) => startGame(socket, code))

  socket.on('getScores', (code: string) => getScores(socket, code))

  socket.on('findLobbyLeader', (code: string) => {
    findLobbyLeader(socket, code)
  })

  socket.on('sendAnswers', ([firstAnswer, secondAnswer]: string[]) => {
    sendAnswers(socket, [firstAnswer, secondAnswer])
  })

  socket.on('checkLobbyIsFull', (code: string) =>
    checkLobbyIsFull(socket, code)
  )

  socket.on('startGameTimer', (code: string) => {
    startGameTimer(socket, code)
  })

  socket.on('sendQuestion', (question: string) =>
    sendQuestion(socket, question)
  )

  socket.on('getStragersQuestion', ([code, number]: [string, number]) => {
    getStragersQuestion(socket, [code, number])
  })

  socket.on('requestQuestions', (code: string) => {
    requestQuestions(socket, code)
  })
  // socket.on('setNumbers', (code) => {
  //   setNumbers(socket, code)
  // })
  socket.on('requestRandomQuestion', (code: string) => {
    requestRandomQuestion(socket, code)
  })

  socket.on('voteForAnswer', (answerNumber: number) => {
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
