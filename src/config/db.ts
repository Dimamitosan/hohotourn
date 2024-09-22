import { Sequelize } from 'sequelize'

const sequelize = new Sequelize('hohoturn_db', 'root', 'fosGAhDd12DSA', {
  host: 'localhost',
  dialect: 'mysql',
})

export default sequelize
