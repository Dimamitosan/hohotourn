import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
dotenv.config({ path: '../../.env' })

const webAppUrl = 'https://client.ru.tuna.am'

const token = process.env.BOT_TOKEN

if (!token) {
  throw Error('token не найден!')
}
const bot = new TelegramBot(token, { polling: true })

bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text

  if (text === '/start') {
    await bot.sendMessage(chatId, 'Для игры нажмите кнопку ниже', {
      reply_markup: {
        inline_keyboard: [[{ text: 'играть', web_app: { url: webAppUrl } }]],
      },
    })
  }
})

export default bot
