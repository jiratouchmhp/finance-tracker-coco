import { useState, useEffect, JSX } from 'react';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency } from '../utils/format';
import type { Product } from '@coco/shared';

export default function Products(): JSX.Element {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [packagingCost, setPackagingCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [unit, setUnit] = useState('bottle');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts(): Promise<void> {
    setLoading(true);
    try {
      setProducts(await productApi.getAll());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await productApi.create({
        name,
        costPriceCents: Math.round(Number(costPrice) * 100),
        packagingCostCents: Math.round(Number(packagingCost) * 100),
        sellingPriceCents: Math.round(Number(sellingPrice) * 100),
        unit,
      });
      setName('');
      setCostPrice('');
      setPackagingCost('');
      setSellingPrice('');
      setUnit('bottle');
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm('Deactivate this product?')) return;
    try {
      await productApi.delete(id);
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  const marginPct = (cost: number, packaging: number, sell: number): string => {
    if (sell === 0) return '0%';
    return `${Math.round(((sell - cost - packaging) / sell) * 100)}%`;
  };

  const columns = [
    { key: 'name', header: 'Product Name' },
    {
      key: 'costPriceCents',
      header: 'Raw Cost',
      render: (item: Record<string, unknown>) => formatCurrency((item as unknown as Product).costPriceCents),
    },
    {
      key: 'packagingCostCents',
      header: 'Packaging',
      render: (item: Record<string, unknown>) => formatCurrency((item as unknown as Product).packagingCostCents),
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      render: (item: Record<string, unknown>) => {
        const p = item as unknown as Product;
        return <span className="font-medium text-gray-700">{formatCurrency(p.costPriceCents + p.packagingCostCents)}</span>;
      },
    },
    {
      key: 'sellingPriceCents',
      header: 'Selling Price',
      render: (item: Record<string, unknown>) => (
        <span className="font-medium text-emerald-600">{formatCurrency((item as unknown as Product).sellingPriceCents)}</span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      render: (item: Record<string, unknown>) => {
        const p = item as unknown as Product;
        return <Badge variant="success">{marginPct(p.costPriceCents, p.packagingCostCents, p.sellingPriceCents)}</Badge>;
      },
    },
    { key: 'unit', header: 'Unit' },
    {
      key: 'actions',
      header: '',
      render: (item: Record<string, unknown>) => (
        user?.role === 'OWNER' ? (
          <button
            onClick={() => handleDelete((item as unknown as Product).id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Products</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      {user?.role === 'OWNER' && (
        <Card title="Add New Product">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coconut Shake" required />
            <Input label="Raw Cost (฿)" type="number" min="0.01" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="Material cost" required />
            <Input label="Packaging (฿)" type="number" min="0" step="0.01" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} placeholder="Bottle, cup, lid" required />
            <Input label="Selling Price (฿)" type="number" min="0.01" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
            <Input label="Unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Add Product'}
            </Button>
          </form>
        </Card>
      )}

      <Card title="All Products">
        {loading ? (
          <Spinner />
        ) : (
          <DataTable columns={columns} data={products as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="No products found" />
        )}
      </Card>
    </div>
  );
}
