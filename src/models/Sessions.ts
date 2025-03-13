import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'
import User from './User'

interface SessionsAttributes {
  id: number
  userId: number
  lobbyCode: string
  lobbyLeader: boolean
  inGame: boolean
  inRound: boolean
  score: number
  number?: number | null
  question?: string | null
  firstAnswer?: string | null
  secondAnswer?: string | null
  voteNumber?: number | null
  isReady?: boolean | null
}

interface SessionsCreationAttributes
  extends Optional<SessionsAttributes, 'id'> {}

class Sessions extends Model implements SessionsAttributes {
  public id!: number
  public userId!: number
  public lobbyCode!: string
  public lobbyLeader!: boolean
  public inGame!: boolean
  public inRound!: boolean
  public score!: number
  public number?: number | null
  public question?: string | null
  public firstAnswer?: string | null
  public secondAnswer?: string | null
  public voteNumber?: number | null
  public isReady?: boolean | null
}

Sessions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    lobbyCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lobbyLeader: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    inGame: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1,
    },
    inRound: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    number: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    question: {
      type: DataTypes.STRING,
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
    voteNumber: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    isReady: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    tableName: 'sessions',
    sequelize,
    timestamps: false,
  }
)
// Sessions.belongsTo(User, { foreignKey: 'userId', as: 'User' })

export default Sessions
