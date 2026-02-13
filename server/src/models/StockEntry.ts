import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface StockEntryAttributes {
  id: number;
  productId: number;
  quantityAdded: number;
  quantityRemaining: number;
  supplierNote: string;
  entryDate: string;
  recordedBy: number;
}

type StockEntryCreationAttributes = Optional<StockEntryAttributes, 'id' | 'supplierNote' | 'quantityRemaining'>;

class StockEntry extends Model<StockEntryAttributes, StockEntryCreationAttributes> implements StockEntryAttributes {
  declare id: number;
  declare productId: number;
  declare quantityAdded: number;
  declare quantityRemaining: number;
  declare supplierNote: string;
  declare entryDate: string;
  declare recordedBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StockEntry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantityAdded: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantityRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    supplierNote: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    entryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    recordedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'StockEntry',
    tableName: 'stock_entries',
    underscored: true,
  }
);

export default StockEntry;
