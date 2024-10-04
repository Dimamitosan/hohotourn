import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'

interface UserAttributes {
  id: number
  nick: string
  coins?: number
  lobbyCode?: string | null
  telegramId?: string
  socket?: string
  lobbyLeader?: boolean | null
  score: number
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number
  public nick!: string
  public coins!: number
  public lobbyCode?: string | null
  public telegramId!: string
  public socket?: string
  public lobbyLeader?: boolean | null
  public score!: number
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
    },
    lobbyCode: {
      type: DataTypes.STRING,
    },
    telegramId: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    socket: {
      type: new DataTypes.STRING(),
    },
    lobbyLeader: {
      type: DataTypes.BOOLEAN,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'user',
    sequelize,
    timestamps: false,
  }
)

export default User
