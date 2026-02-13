import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { UserRole } from '@coco/shared';

interface UserAttributes {
  id: number;
  username: string;
  passwordHash: string;
  role: UserRole;
}

type UserCreationAttributes = Optional<UserAttributes, 'id'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare passwordHash: string;
  declare role: UserRole;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('OWNER', 'STAFF'),
      allowNull: false,
      defaultValue: 'STAFF',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
  }
);

export default User;
