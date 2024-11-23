import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'

interface UserAttributes {
  id: number
  nick: string
  coins?: number
  lobbyCode?: string | null
  telegramId?: string
  socket?: string | null
  lobbyLeader?: boolean | null
  score: number
  number?: number | null

  question?: string | null
  firstAnswer?: string | null
  secondAnswer?: string | null

  voteNumber?: number | null
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
  public socket!: string | null
  public lobbyLeader?: boolean | null
  public score!: number
  public number?: number | null

  public question?: string | null
  public firstAnswer?: string | null
  public secondAnswer?: string | null

  public voteNumber?: number | null
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
    number: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    firstAnswer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondAnswer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    voteNumber: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
  },
  {
    tableName: 'user',
    sequelize,
    timestamps: false,
  }
)

export default User
