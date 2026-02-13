import User from './User';
import Product from './Product';
import Sale from './Sale';
import StockEntry from './StockEntry';
import Expense from './Expense';
import DailySummary from './DailySummary';

// --- Associations ---

// Product → Sales (1:many)
Product.hasMany(Sale, { foreignKey: 'productId', as: 'sales' });
Sale.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Product → StockEntries (1:many)
Product.hasMany(StockEntry, { foreignKey: 'productId', as: 'stockEntries' });
StockEntry.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// User → Sales (1:many) - who recorded the sale
User.hasMany(Sale, { foreignKey: 'recordedBy', as: 'salesRecorded' });
Sale.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

// User → StockEntries (1:many) - who recorded the stock entry
User.hasMany(StockEntry, { foreignKey: 'recordedBy', as: 'stockEntriesRecorded' });
StockEntry.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

// User → Expenses (1:many) - who recorded the expense
User.hasMany(Expense, { foreignKey: 'recordedBy', as: 'expensesRecorded' });
Expense.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

export { User, Product, Sale, StockEntry, Expense, DailySummary };
