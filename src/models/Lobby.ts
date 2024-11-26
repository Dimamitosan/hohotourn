import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'

interface LobbyAttributes {
  lobbyCode: string
  gameStarted: boolean
  maxPlayers: number
  countOfRounds: number
  usedQuestions: string
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
  },
  {
    tableName: 'lobby',
    sequelize,
    timestamps: false,
  }
)

export default Lobby
