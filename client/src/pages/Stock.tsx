import { useState, useEffect, JSX } from 'react';
import { stockApi, productApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { getToday } from '../utils/format';
import type { StockLevel, Product } from '@coco/shared';

const LOW_STOCK_THRESHOLD = 10;

export default function Stock(): JSX.Element {
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [productId, setProductId] = useState('');
  const [quantityAdded, setQuantityAdded] = useState('');
  const [supplierNote, setSupplierNote] = useState('');
  const [entryDate, setEntryDate] = useState(getToday());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(): Promise<void> {
    setLoading(true);
    try {
      const [levelsData, productsData] = await Promise.all([
        stockApi.getLevels(),
        productApi.getAll(),
      ]);
      setLevels(levelsData);
      setProducts(productsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await stockApi.addEntry({
        productId: Number(productId),
        quantityAdded: Number(quantityAdded),
        supplierNote,
        entryDate,
      });
      setProductId('');
      setQuantityAdded('');
      setSupplierNote('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: 'productName', header: 'Product' },
    { key: 'totalAdded', header: 'Total Added' },
    { key: 'totalSold', header: 'Total Sold' },
    {
      key: 'currentStock',
      header: 'Current Stock',
      render: (item: Record<string, unknown>) => {
        const level = item as unknown as StockLevel;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{level.currentStock}</span>
            {level.currentStock <= LOW_STOCK_THRESHOLD && (
              <Badge variant="danger">Low</Badge>
            )}
            {level.currentStock < 0 && (
              <Badge variant="danger">⚠️ Negative</Badge>
            )}
          </div>
        );
      },
    },
    { key: 'unit', header: 'Unit' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      {/* Add Stock Form */}
      <Card title="Add Stock Entry">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Select
            label="Product"
            options={products.map((p) => ({ value: String(p.id), label: p.name }))}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={quantityAdded}
            onChange={(e) => setQuantityAdded(e.target.value)}
            required
          />
          <Input
            label="Date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
          <Input
            label="Supplier Note"
            type="text"
            value={supplierNote}
            onChange={(e) => setSupplierNote(e.target.value)}
            placeholder="Optional note"
          />
          <Button type="submit" disabled={submitting || !productId || !quantityAdded}>
            {submitting ? 'Adding...' : 'Add Stock'}
          </Button>
        </form>
      </Card>

      {/* Stock Levels */}
      <Card title="Current Stock Levels">
        {loading ? (
          <Spinner />
        ) : (
          <DataTable
            columns={columns}
            data={levels as unknown as Record<string, unknown>[]}
            keyField="productId"
            emptyMessage="No stock data available"
          />
        )}
      </Card>
    </div>
  );
}
