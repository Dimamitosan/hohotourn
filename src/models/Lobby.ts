import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/db'

interface LobbyAttributes {
  lobbyCode: string
}

interface LobbyCreationAttributes
  extends Optional<LobbyAttributes, 'lobbyCode'> {}

class Lobby
  extends Model<LobbyAttributes, LobbyCreationAttributes>
  implements LobbyAttributes
{
  public lobbyCode!: string
}

Lobby.init(
  {
    lobbyCode: {
      type: new DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'lobby',
    sequelize,
    timestamps: false,
  }
)

export default Lobby
