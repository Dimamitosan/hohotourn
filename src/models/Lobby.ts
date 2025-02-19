import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'

interface LobbyAttributes {
  lobbyCode: string
  gameStarted: boolean
  maxPlayers: number
  countOfRounds: number
  usedQuestions: string
  isOpen: boolean
  countOfPlayers: number
  numberOfQuestion: number
}

interface LobbyCreationAttributes
  extends Optional<LobbyAttributes, 'lobbyCode'> {}

class Lobby
  extends Model<LobbyAttributes, LobbyCreationAttributes>
  implements LobbyAttributes
{
  public lobbyCode!: string
  public gameStarted!: boolean
  public maxPlayers!: number
  public countOfRounds!: number
  public usedQuestions!: string
  public isOpen!: boolean
  public countOfPlayers!: number
  public numberOfQuestion!: number
}

Lobby.init(
  {
    lobbyCode: {
      type: new DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    gameStarted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    maxPlayers: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    countOfRounds: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    usedQuestions: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    countOfPlayers: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    numberOfQuestion: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
  },
  {
    tableName: 'lobby',
    sequelize,
    timestamps: false,
  }
)

export default Lobby
