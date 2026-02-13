import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { ExpenseCategory } from '@coco/shared';

interface ExpenseAttributes {
  id: number;
  category: ExpenseCategory;
  amountCents: number;
  description: string;
  expenseDate: string;
  recordedBy: number;
}

type ExpenseCreationAttributes = Optional<ExpenseAttributes, 'id'>;

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  declare id: number;
  declare category: ExpenseCategory;
  declare amountCents: number;
  declare description: string;
  declare expenseDate: string;
  declare recordedBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM('LABOR', 'INGREDIENT', 'UTILITY', 'OTHER'),
      allowNull: false,
    },
    amountCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expenseDate: {
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
    modelName: 'Expense',
    tableName: 'expenses',
    underscored: true,
  }
);

export default Expense;
