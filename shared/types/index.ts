// ============================================================================
// Coco Tracker — Shared Type Definitions
// Single source of truth for API contracts between client and server
// ============================================================================

// --- Enums ---

export type UserRole = 'OWNER' | 'STAFF';

export type ExpenseCategory = 'LABOR' | 'INGREDIENT' | 'UTILITY' | 'OTHER';

export const FIXED_CATEGORIES: ExpenseCategory[] = ['LABOR', 'UTILITY'];
export const VARIABLE_CATEGORIES: ExpenseCategory[] = ['INGREDIENT', 'OTHER'];

export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

// --- User ---

export interface User {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateUserRequest {
  username?: string;
  role?: UserRole;
}

export interface ChangePasswordRequest {
  newPassword: string;
}

// --- Product ---

export interface Product {
  id: number;
  name: string;
  costPriceCents: number;
  packagingCostCents: number;
  sellingPriceCents: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  costPriceCents: number;
  packagingCostCents: number;
  sellingPriceCents: number;
  unit: string;
}

export interface UpdateProductRequest {
  name?: string;
  costPriceCents?: number;
  packagingCostCents?: number;
  sellingPriceCents?: number;
  unit?: string;
  isActive?: boolean;
}

// --- Stock Entry ---

export interface StockEntry {
  id: number;
  productId: number;
  quantityAdded: number;
  quantityRemaining: number;
  supplierNote: string;
  entryDate: string;
  recordedBy: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  recorder?: User;
}

export interface CreateStockEntryRequest {
  productId: number;
  quantityAdded: number;
  supplierNote?: string;
  entryDate: string;
}

// --- Sale ---

export interface Sale {
  id: number;
  productId: number;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  saleDate: string;
  recordedBy: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  recorder?: User;
}

export interface CreateSaleRequest {
  productId: number;
  quantity: number;
  unitPriceCents: number;
  saleDate: string;
}

// --- Expense ---

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amountCents: number;
  description: string;
  expenseDate: string;
  recordedBy: number;
  createdAt: string;
  updatedAt: string;
  recorder?: User;
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  amountCents: number;
  description: string;
  expenseDate?: string;
  expenseMonth?: string;
}

// --- Daily Summary ---

export interface DailySummary {
  id: number;
  date: string;
  totalRevenueCents: number;
  totalCogsCents: number;
  totalLaborCents: number;
  totalExpensesCents: number;
  netProfitCents: number;
  salesCount: number;
  generatedAt: string;
}

// --- Dashboard ---

export interface DashboardDaily {
  date: string;
  totalRevenueCents: number;
  totalCogsCents: number;
  totalLaborCents: number;
  totalOtherExpensesCents: number;
  netProfitCents: number;
  salesCount: number;
  topProducts: Array<{ productName: string; quantity: number; totalCents: number }>;
  fraudAlertCount: number;
}

export interface DashboardMonthly {
  month: string;
  totalRevenueCents: number;
  totalCogsCents: number;
  totalLaborCents: number;
  totalUtilityCents: number;
  totalOtherExpensesCents: number;
  grossProfitCents: number;
  netProfitCents: number;
  dailySummaries: DailySummary[];
}

// --- Fraud ---

export interface FraudAlert {
  id: string;
  severity: FraudSeverity;
  type: string;
  description: string;
  detectedAt: string;
  affectedDateRange: { from: string; to: string };
  relatedRecordIds: number[];
}

// --- Stock Level ---

export interface StockLevel {
  productId: number;
  productName: string;
  totalAdded: number;
  totalSold: number;
  currentStock: number;
  unit: string;
}

// --- API Response Wrappers ---

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// --- Monthly Report ---

export interface MonthlyReport {
  month: string;
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  laborCents: number;
  utilityCents: number;
  otherExpensesCents: number;
  totalExpensesCents: number;
  netProfitCents: number;
  previousMonth?: MonthlyReport;
}

// --- Expense Summary ---

export interface ExpenseSummary {
  month: string;
  byCategory: Record<ExpenseCategory, number>;
  totalCents: number;
}

// --- Time Period ---

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

// --- Dashboard Weekly ---

export interface DashboardWeekly {
  weekStart: string;
  weekEnd: string;
  totalRevenueCents: number;
  totalCogsCents: number;
  totalLaborCents: number;
  totalOtherExpensesCents: number;
  netProfitCents: number;
  salesCount: number;
  topProducts: Array<{ productName: string; quantity: number; totalCents: number }>;
  fraudAlertCount: number;
}

// --- Dashboard Custom Range ---

export interface DashboardCustomRange {
  startDate: string;
  endDate: string;
  totalRevenueCents: number;
  totalCogsCents: number;
  totalLaborCents: number;
  totalOtherExpensesCents: number;
  netProfitCents: number;
  salesCount: number;
  topProducts: Array<{ productName: string; quantity: number; totalCents: number }>;
  fraudAlertCount: number;
}

// --- Sales Analytics ---

export interface SalesTrendPoint {
  label: string;
  revenueCents: number;
  count: number;
}

export interface ProductBreakdown {
  productName: string;
  revenueCents: number;
  percentage: number;
}

export interface TopProductRanking {
  productName: string;
  totalRevenueCents: number;
  totalQuantity: number;
}

export interface SalesAnalytics {
  periodLabel: string;
  trendData: SalesTrendPoint[];
  topProducts: TopProductRanking[];
  totalRevenueCents: number;
  totalSalesCount: number;
  avgOrderValueCents: number;
  avgUnitsPerSale: number;
  productBreakdown: ProductBreakdown[];
  previousPeriodRevenueCents: number;
  revenueChangePct: number;
}

// --- Fraud Analytics ---

export interface StaffActivity {
  userId: number;
  username: string;
  role: UserRole;
  salesCount: number;
  totalRevenueCents: number;
  avgOrderValueCents: number;
  stockEntriesCount: number;
  expensesRecordedCount: number;
  totalExpensesCents: number;
  deletedSalesCount: number;
  /** Flags: unusual patterns detected for this staff member */
  flags: StaffFlag[];
}

export interface StaffFlag {
  type: 'HIGH_VOID_RATE' | 'UNUSUAL_DISCOUNT' | 'ODD_HOURS' | 'HIGH_EXPENSE' | 'STOCK_ANOMALY';
  severity: FraudSeverity;
  description: string;
}

export interface VoidedSaleRecord {
  saleId: number;
  productName: string;
  quantity: number;
  totalCents: number;
  saleDate: string;
  recordedBy: string;
  deletedAt: string;
}

export interface DailyAnomalyPoint {
  date: string;
  revenueCents: number;
  salesCount: number;
  avgRevenueCents: number;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface StockDiscrepancy {
  productId: number;
  productName: string;
  totalStocked: number;
  totalSold: number;
  expectedRemaining: number;
  actualRemaining: number;
  discrepancy: number;
  severity: FraudSeverity;
}

export interface FraudDashboard {
  alerts: FraudAlert[];
  staffActivities: StaffActivity[];
  stockDiscrepancies: StockDiscrepancy[];
  dailyAnomalies: DailyAnomalyPoint[];
  summary: {
    totalAlerts: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    staffWithFlags: number;
    stockDiscrepancyCount: number;
  };
}
