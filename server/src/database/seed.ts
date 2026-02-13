import bcrypt from 'bcryptjs';
import { connectDatabase, sequelize } from '../config/database';
import { APP_CONFIG } from '../config/app';

// Import models (triggers association setup)
import { User, Product, StockEntry, Sale, Expense } from '../models';

async function seed(): Promise<void> {
  await connectDatabase();

  // Force sync to reset tables
  await sequelize.sync({ force: true });
  console.log('[Seed] Tables reset');

  // Create owner account
  const ownerHash = await bcrypt.hash('owner123', APP_CONFIG.BCRYPT_SALT_ROUNDS);
  const owner = await User.create({
    username: 'owner',
    passwordHash: ownerHash,
    role: 'OWNER',
  });

  // Create staff account
  const staffHash = await bcrypt.hash('staff123', APP_CONFIG.BCRYPT_SALT_ROUNDS);
  const staff = await User.create({
    username: 'staff',
    passwordHash: staffHash,
    role: 'STAFF',
  });

  console.log('[Seed] Users created: owner, staff');

  // Create products (prices in satang/cents)
  const products = await Product.bulkCreate([
    { name: 'Coconut Water Small', costPriceCents: 1000, packagingCostCents: 300, sellingPriceCents: 2500, unit: 'bottle' },
    { name: 'Coconut Water Medium', costPriceCents: 1500, packagingCostCents: 400, sellingPriceCents: 3500, unit: 'bottle' },
    { name: 'Coconut Water Large', costPriceCents: 2000, packagingCostCents: 500, sellingPriceCents: 4500, unit: 'bottle' },
    { name: 'Coconut Pudding', costPriceCents: 1500, packagingCostCents: 250, sellingPriceCents: 3500, unit: 'cup' },
    { name: 'Coconut Shell', costPriceCents: 500, packagingCostCents: 100, sellingPriceCents: 1500, unit: 'piece' },
    { name: 'ทองม้วนสดมะพร้าว', costPriceCents: 2000, packagingCostCents: 200, sellingPriceCents: 4000, unit: 'pack' },
  ]);

  console.log('[Seed] Products created:', products.length);

  // Create stock entries for today and recent days
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  for (const product of products) {
    await StockEntry.create({
      productId: product.id,
      quantityAdded: 50,
      quantityRemaining: 50,
      supplierNote: 'Initial stock',
      entryDate: yesterday,
      recordedBy: owner.id,
    });

    await StockEntry.create({
      productId: product.id,
      quantityAdded: 30,
      quantityRemaining: 30,
      supplierNote: 'Restock',
      entryDate: today,
      recordedBy: staff.id,
    });
  }

  console.log('[Seed] Stock entries created');

  // Create some sample sales
  const saleData = [
    { productId: products[0].id, quantity: 15, unitPriceCents: 2500, saleDate: today },
    { productId: products[1].id, quantity: 10, unitPriceCents: 3500, saleDate: today },
    { productId: products[2].id, quantity: 8, unitPriceCents: 4500, saleDate: today },
    { productId: products[3].id, quantity: 6, unitPriceCents: 3500, saleDate: today },
    { productId: products[4].id, quantity: 12, unitPriceCents: 1500, saleDate: today },
    { productId: products[5].id, quantity: 5, unitPriceCents: 4000, saleDate: today },
    { productId: products[0].id, quantity: 20, unitPriceCents: 2500, saleDate: yesterday },
    { productId: products[1].id, quantity: 12, unitPriceCents: 3500, saleDate: yesterday },
    { productId: products[5].id, quantity: 8, unitPriceCents: 4000, saleDate: yesterday },
  ];

  for (const s of saleData) {
    await Sale.create({
      ...s,
      totalCents: s.quantity * s.unitPriceCents,
      recordedBy: staff.id,
    });
  }

  console.log('[Seed] Sales created');

  // Create some expenses
  // Fixed costs stored on 1st of the month
  const monthStart = `${today.substring(0, 7)}-01`;

  await Expense.bulkCreate([
    // Fixed monthly costs
    { category: 'LABOR', amountCents: 900000, description: 'Staff monthly wage', expenseDate: monthStart, recordedBy: owner.id },
    { category: 'UTILITY', amountCents: 150000, description: 'Monthly electricity bill', expenseDate: monthStart, recordedBy: owner.id },
    // Variable daily costs (selling-related)
    { category: 'INGREDIENT', amountCents: 5000, description: 'Ice and cups', expenseDate: today, recordedBy: staff.id },
    { category: 'OTHER', amountCents: 3000, description: 'Cleaning supplies', expenseDate: today, recordedBy: staff.id },
  ]);

  console.log('[Seed] Expenses created');
  console.log('[Seed] Done! DB seeded successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
