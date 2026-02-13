import { Op } from 'sequelize';
import { Expense } from '../../models';
import { AppError } from '../../utils/AppError';
import type { ExpenseCategory, ExpenseSummary } from '@coco/shared';

const FIXED_CATS: string[] = ['LABOR', 'UTILITY'];

export async function createExpense(data: {
  category: ExpenseCategory;
  amountCents: number;
  description: string;
  expenseDate?: string;
  expenseMonth?: string;
  recordedBy: number;
}): Promise<Expense> {
  const isFixed = FIXED_CATS.includes(data.category);
  const expenseDate = isFixed
    ? `${data.expenseMonth}-01`
    : data.expenseDate!;

  return Expense.create({
    category: data.category,
    amountCents: data.amountCents,
    description: data.description,
    expenseDate,
    recordedBy: data.recordedBy,
  });
}

export async function getExpensesByDate(date: string): Promise<Expense[]> {
  return Expense.findAll({
    where: {
      expenseDate: date,
      category: { [Op.in]: ['INGREDIENT', 'OTHER'] },
    },
    order: [['createdAt', 'DESC']],
  });
}

export async function getFixedExpensesByMonth(month: string): Promise<Expense[]> {
  const [year, mon] = month.split('-').map(Number);
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const endDate = mon === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

  return Expense.findAll({
    where: {
      category: { [Op.in]: ['LABOR', 'UTILITY'] },
      expenseDate: { [Op.gte]: startDate, [Op.lt]: endDate },
    },
    order: [['createdAt', 'DESC']],
  });
}

export async function getExpenseSummaryByMonth(month: string): Promise<ExpenseSummary> {
  const [year, mon] = month.split('-').map(Number);
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const endDate = mon === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

  const expenses = await Expense.findAll({
    where: {
      expenseDate: { [Op.gte]: startDate, [Op.lt]: endDate },
    },
  });

  const byCategory: Record<ExpenseCategory, number> = {
    LABOR: 0,
    INGREDIENT: 0,
    UTILITY: 0,
    OTHER: 0,
  };

  let totalCents = 0;

  for (const exp of expenses) {
    byCategory[exp.category] += exp.amountCents;
    totalCents += exp.amountCents;
  }

  return { month, byCategory, totalCents };
}

export async function deleteExpense(id: number): Promise<void> {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new AppError('Expense not found', 404);
  await expense.destroy();
}
