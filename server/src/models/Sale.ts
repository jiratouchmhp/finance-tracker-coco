import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SaleAttributes {
  id: number;
  productId: number;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  saleDate: string;
  recordedBy: number;
}

type SaleCreationAttributes = Optional<SaleAttributes, 'id' | 'totalCents'>;

class Sale extends Model<SaleAttributes, SaleCreationAttributes> implements SaleAttributes {
  declare id: number;
  declare productId: number;
  declare quantity: number;
  declare unitPriceCents: number;
  declare totalCents: number;
  declare saleDate: string;
  declare recordedBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Sale.init(
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPriceCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    saleDate: {
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
    modelName: 'Sale',
    tableName: 'sales',
    underscored: true,
  }
);

export default Sale;
