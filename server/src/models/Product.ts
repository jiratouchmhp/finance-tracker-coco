import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProductAttributes {
  id: number;
  name: string;
  costPriceCents: number;
  packagingCostCents: number;
  sellingPriceCents: number;
  unit: string;
  isActive: boolean;
}

type ProductCreationAttributes = Optional<ProductAttributes, 'id' | 'isActive' | 'packagingCostCents'>;

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare name: string;
  declare costPriceCents: number;
  declare packagingCostCents: number;
  declare sellingPriceCents: number;
  declare unit: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    costPriceCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    packagingCostCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sellingPriceCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'bottle',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    underscored: true,
  }
);

export default Product;
