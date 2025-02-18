import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const password = process.env.BDPASSWORD

const sequelize = new Sequelize('hohoturn_db', 'root', password, {
  host: 'localhost',
  dialect: 'mysql',
})

export default sequelize
