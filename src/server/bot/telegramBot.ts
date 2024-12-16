import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const token = process.env.BOT_TOKEN

if (!token) {
  throw Error('token не найден!')
}
const bot = new TelegramBot(token, { polling: true })

export default bot
