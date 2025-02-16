import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'
import User from './User'
import Sessions from './Sessions'

User.hasMany(Sessions, {
  foreignKey: 'userId',
  sourceKey: 'id',
  as: 'Sessions',
})
Sessions.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'User' })

// dbHelper.syncAllForce();

export { User, Sessions }
