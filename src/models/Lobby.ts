import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'

interface LobbyAttributes {
  lobbyCode: string
  gameStarted: boolean
}

interface LobbyCreationAttributes
  extends Optional<LobbyAttributes, 'lobbyCode'> {}

class Lobby
  extends Model<LobbyAttributes, LobbyCreationAttributes>
  implements LobbyAttributes
{
  public lobbyCode!: string
  public gameStarted!: boolean
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
  },
  {
    tableName: 'lobby',
    sequelize,
    timestamps: false,
  }
)

export default Lobby
