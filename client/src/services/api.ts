import axios from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UpdateUserRequest,
  ChangePasswordRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Sale,
  CreateSaleRequest,
  StockEntry,
  CreateStockEntryRequest,
  StockLevel,
  Expense,
  CreateExpenseRequest,
  ExpenseSummary,
  DashboardDaily,
  DashboardWeekly,
  DashboardMonthly,
  DashboardCustomRange,
  MonthlyReport,
  FraudAlert,
  FraudDashboard,
  TimePeriod,
  SalesAnalytics,
} from '@coco/shared';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('coco_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response unwrapper
function unwrap<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data;
  if (body.success) return body.data;
  throw new Error(body.error);
}

// --- Auth ---
export const authApi = {
  login: (data: LoginRequest) => api.post('/auth/login', data).then(unwrap<AuthResponse>),
  register: (data: RegisterRequest) => api.post('/auth/register', data).then(unwrap<AuthResponse>),
};

// --- Users ---
export const userApi = {
  getAll: () => api.get('/users').then(unwrap<User[]>),
  getById: (id: number) => api.get(`/users/${id}`).then(unwrap<User>),
  update: (id: number, data: UpdateUserRequest) => api.put(`/users/${id}`, data).then(unwrap<User>),
  changePassword: (id: number, data: ChangePasswordRequest) => api.put(`/users/${id}/password`, data).then(unwrap<null>),
  delete: (id: number) => api.delete(`/users/${id}`).then(unwrap<null>),
};

// --- Products ---
export const productApi = {
  getAll: () => api.get('/products').then(unwrap<Product[]>),
  getById: (id: number) => api.get(`/products/${id}`).then(unwrap<Product>),
  create: (data: CreateProductRequest) => api.post('/products', data).then(unwrap<Product>),
  update: (id: number, data: UpdateProductRequest) => api.put(`/products/${id}`, data).then(unwrap<Product>),
  delete: (id: number) => api.delete(`/products/${id}`).then(unwrap<null>),
};

// --- Sales ---
export const salesApi = {
  create: (data: CreateSaleRequest) => api.post('/sales', data).then(unwrap<Sale>),
  getByDate: (date: string) => api.get('/sales/by-date', { params: { date } }).then(unwrap<Sale[]>),
  getByWeek: (date: string) =>
    api.get('/sales/by-week', { params: { date } }).then(unwrap<{ sales: Sale[]; totalRevenueCents: number; totalCount: number }>),
  getByMonth: (month: string) =>
    api.get('/sales/by-month', { params: { month } }).then(unwrap<{ sales: Sale[]; totalRevenueCents: number; totalCount: number }>),
  getByRange: (start: string, end: string) =>
    api.get('/sales/by-range', { params: { start, end } }).then(unwrap<{ sales: Sale[]; totalRevenueCents: number; totalCount: number }>),
  getAnalytics: (period: TimePeriod, ref: string) =>
    api.get('/sales/analytics', { params: { period, ref } }).then(unwrap<SalesAnalytics>),
  getCustomAnalytics: (start: string, end: string) =>
    api.get('/sales/analytics', { params: { period: 'custom', start, end } }).then(unwrap<SalesAnalytics>),
  delete: (id: number) => api.delete(`/sales/${id}`).then(unwrap<null>),
};

// --- Stock ---
export const stockApi = {
  addEntry: (data: CreateStockEntryRequest) => api.post('/stock', data).then(unwrap<StockEntry>),
  getLevels: () => api.get('/stock/levels').then(unwrap<StockLevel[]>),
  getHistory: (productId: number) => api.get(`/stock/history/${productId}`).then(unwrap<StockEntry[]>),
};

// --- Expenses ---
export const expenseApi = {
  create: (data: CreateExpenseRequest) => api.post('/expenses', data).then(unwrap<Expense>),
  getByDate: (date: string) => api.get('/expenses/by-date', { params: { date } }).then(unwrap<Expense[]>),
  getFixedByMonth: (month: string) => api.get('/expenses/fixed-by-month', { params: { month } }).then(unwrap<Expense[]>),
  getSummary: (month: string) => api.get('/expenses/summary', { params: { month } }).then(unwrap<ExpenseSummary>),
  delete: (id: number) => api.delete(`/expenses/${id}`).then(unwrap<null>),
};

// --- Dashboard ---
export const dashboardApi = {
  getDaily: (date: string) => api.get('/dashboard/daily', { params: { date } }).then(unwrap<DashboardDaily>),
  getWeekly: (date: string) => api.get('/dashboard/weekly', { params: { date } }).then(unwrap<DashboardWeekly>),
  getMonthly: (month: string) => api.get('/dashboard/monthly', { params: { month } }).then(unwrap<DashboardMonthly>),
  getCustomRange: (start: string, end: string) =>
    api.get('/dashboard/custom', { params: { start, end } }).then(unwrap<DashboardCustomRange>),
  getReport: (month: string) => api.get('/dashboard/report', { params: { month } }).then(unwrap<MonthlyReport>),
};

// --- Fraud ---
export const fraudApi = {
  getAlerts: () => api.get('/fraud/alerts').then(unwrap<FraudAlert[]>),
  getDashboard: (days?: number) =>
    api.get('/fraud/dashboard', { params: days ? { days } : {} }).then(unwrap<FraudDashboard>),
};
