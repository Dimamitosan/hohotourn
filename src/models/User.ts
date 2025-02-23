import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'

interface UserAttributes {
  id: number
  nick: string
  coins?: number
  telegramId?: string
  socket?: string | null
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number
  public nick!: string
  public coins!: number
  public telegramId!: string
  public socket!: string | null
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nick: {
      type: new DataTypes.STRING(45),
      allowNull: false,
    },
    coins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    telegramId: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    socket: {
      type: new DataTypes.STRING(),
    },
  },
  {
    tableName: 'user',
    sequelize,
    timestamps: false,
  }
)

export default User
