import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DailySummaryAttributes {
  id: number;
  date: string;
  totalRevenueCents: number;
  totalCogsCents: number;
  totalLaborCents: number;
  totalExpensesCents: number;
  netProfitCents: number;
  salesCount: number;
  generatedAt: Date;
}

type DailySummaryCreationAttributes = Optional<DailySummaryAttributes, 'id' | 'generatedAt'>;

class DailySummary extends Model<DailySummaryAttributes, DailySummaryCreationAttributes> implements DailySummaryAttributes {
  declare id: number;
  declare date: string;
  declare totalRevenueCents: number;
  declare totalCogsCents: number;
  declare totalLaborCents: number;
  declare totalExpensesCents: number;
  declare netProfitCents: number;
  declare salesCount: number;
  declare generatedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DailySummary.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true,
    },
    totalRevenueCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalCogsCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalLaborCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalExpensesCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    netProfitCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    salesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'DailySummary',
    tableName: 'daily_summaries',
    underscored: true,
  }
);

export default DailySummary;
