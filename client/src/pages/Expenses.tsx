import { useState, useEffect, JSX } from 'react';
import { expenseApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatDate, getToday, getCurrentMonth } from '../utils/format';
import type { Expense, ExpenseSummary, ExpenseCategory } from '@coco/shared';

const FIXED_CATEGORY_OPTIONS = [
  { value: 'LABOR', label: 'Labor / Wages' },
  { value: 'UTILITY', label: 'Utilities (Electric, Water)' },
];

const VARIABLE_CATEGORY_OPTIONS = [
  { value: 'INGREDIENT', label: 'Shared Supplies (Ice, Straws)' },
  { value: 'OTHER', label: 'Other Daily Costs' },
];

const CATEGORY_COLORS: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
  LABOR: 'info',
  INGREDIENT: 'warning',
  UTILITY: 'success',
  OTHER: 'neutral',
};

export default function Expenses(): JSX.Element {
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(getToday());
  const [month, setMonth] = useState(getCurrentMonth());

  // Fixed cost form state
  const [fixedCategory, setFixedCategory] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedDescription, setFixedDescription] = useState('');
  const [submittingFixed, setSubmittingFixed] = useState(false);

  // Variable cost form state
  const [varCategory, setVarCategory] = useState('');
  const [varAmount, setVarAmount] = useState('');
  const [varDescription, setVarDescription] = useState('');
  const [submittingVar, setSubmittingVar] = useState(false);

  useEffect(() => {
    loadData();
  }, [date, month]);

  async function loadData(): Promise<void> {
    setLoading(true);
    try {
      const [fixedData, varData, summaryData] = await Promise.all([
        expenseApi.getFixedByMonth(month),
        expenseApi.getByDate(date),
        expenseApi.getSummary(month),
      ]);
      setFixedExpenses(fixedData);
      setVariableExpenses(varData);
      setSummary(summaryData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }

  async function handleFixedSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmittingFixed(true);
    setError('');

    try {
      await expenseApi.create({
        category: fixedCategory as ExpenseCategory,
        amountCents: Math.round(Number(fixedAmount) * 100),
        description: fixedDescription,
        expenseMonth: month,
      });
      setFixedCategory('');
      setFixedAmount('');
      setFixedDescription('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add fixed expense');
    } finally {
      setSubmittingFixed(false);
    }
  }

  async function handleVarSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmittingVar(true);
    setError('');

    try {
      await expenseApi.create({
        category: varCategory as ExpenseCategory,
        amountCents: Math.round(Number(varAmount) * 100),
        description: varDescription,
        expenseDate: date,
      });
      setVarCategory('');
      setVarAmount('');
      setVarDescription('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setSubmittingVar(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseApi.delete(id);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  }

  const expenseColumns = [
    {
      key: 'category',
      header: 'Category',
      render: (item: Record<string, unknown>) => {
        const exp = item as unknown as Expense;
        return <Badge variant={CATEGORY_COLORS[exp.category] || 'neutral'}>{exp.category}</Badge>;
      },
    },
    { key: 'description', header: 'Description' },
    {
      key: 'amountCents',
      header: 'Amount',
      render: (item: Record<string, unknown>) => (
        <span className="font-medium">{formatCurrency((item as unknown as Expense).amountCents)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Record<string, unknown>) => (
        <button
          onClick={() => handleDelete((item as unknown as Expense).id)}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      {/* Monthly Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(summary.byCategory).map(([cat, cents]) => (
            <Card key={cat} className="text-center">
              <Badge variant={CATEGORY_COLORS[cat] || 'neutral'}>{cat}</Badge>
              <p className="text-lg font-bold mt-2">{formatCurrency(cents)}</p>
            </Card>
          ))}
          <Card className="text-center bg-gray-800 text-white">
            <p className="text-sm text-gray-300">Total ({month})</p>
            <p className="text-lg font-bold mt-2">{formatCurrency(summary.totalCents)}</p>
          </Card>
        </div>
      )}

      {/* ── Section 1: Monthly Fixed Costs ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Monthly Fixed Costs</h2>
          <Input label="" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
        </div>

        <Card title="Add Fixed Cost">
          <form onSubmit={handleFixedSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select
              label="Category"
              options={FIXED_CATEGORY_OPTIONS}
              value={fixedCategory}
              onChange={(e) => setFixedCategory(e.target.value)}
              required
            />
            <Input
              label="Amount (฿)"
              type="number"
              min="0.01"
              step="0.01"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="e.g. 9000.00"
              required
            />
            <Input
              label="Description"
              type="text"
              value={fixedDescription}
              onChange={(e) => setFixedDescription(e.target.value)}
              placeholder="e.g. Staff monthly wage"
              required
            />
            <Button type="submit" disabled={submittingFixed || !fixedCategory || !fixedAmount || !fixedDescription}>
              {submittingFixed ? 'Adding...' : 'Add Fixed Cost'}
            </Button>
          </form>
        </Card>

        <Card title={`Fixed Costs — ${month}`}>
          {loading ? (
            <Spinner />
          ) : (
            <DataTable columns={expenseColumns} data={fixedExpenses as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="No fixed costs for this month" />
          )}
        </Card>
      </div>

      {/* ── Section 2: Daily Shared Costs ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Daily Shared Costs</h2>
          <Input label="" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        </div>

        <Card title="Add Shared Cost">
          <form onSubmit={handleVarSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select
              label="Category"
              options={VARIABLE_CATEGORY_OPTIONS}
              value={varCategory}
              onChange={(e) => setVarCategory(e.target.value)}
              required
            />
            <Input
              label="Amount (฿)"
              type="number"
              min="0.01"
              step="0.01"
              value={varAmount}
              onChange={(e) => setVarAmount(e.target.value)}
              placeholder="e.g. 80.00"
              required
            />
            <Input
              label="Description"
              type="text"
              value={varDescription}
              onChange={(e) => setVarDescription(e.target.value)}
              placeholder="e.g. Ice 2 bags"
              required
            />
            <Button type="submit" disabled={submittingVar || !varCategory || !varAmount || !varDescription}>
              {submittingVar ? 'Adding...' : 'Add Shared Cost'}
            </Button>
          </form>
        </Card>

        <Card title={`Shared Costs — ${formatDate(date)}`}>
          {loading ? (
            <Spinner />
          ) : (
            <DataTable columns={expenseColumns} data={variableExpenses as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="No shared costs for this date" />
          )}
        </Card>
      </div>
    </div>
  );
}
