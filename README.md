# Coco Tracker 🥥

Finance tracking app for a coconut water shop — daily/monthly revenue, cost tracking, stock management, fraud detection, and profit dashboards.

## Features

- **Dashboard** — Daily, weekly, monthly, and custom date range profit summaries with top-product rankings
- **Sales Management** — Record, view, and delete sales; analytics with trends, product breakdowns, and revenue change %
- **Stock Tracking** — Add stock entries, view current stock levels, and browse stock history per product
- **Expense Tracking** — Record expenses across 4 categories (labor, ingredients, utilities, other) with monthly summaries
- **Fraud Detection** — Stock discrepancy detection, daily anomaly detection, and staff activity monitoring (owner only)
- **Product Management** — Full CRUD for products with cost price, packaging cost, and selling price (owner only)
- **Monthly Reports** — Revenue, COGS, gross profit, labor, utilities, other expenses, net profit with previous-month comparison
- **Charts** — Recharts-based data visualization on the dashboard
- **Role-based Access Control** — Owner vs. Staff permissions across the entire app

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router v7, Tailwind CSS v4, Vite 6, Recharts 2 |
| Backend | Express.js 4, Sequelize 6, Zod validation |
| Database | SQLite 3 (file-based) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Language | TypeScript 5.7 (strict mode) |
| Monorepo | npm workspaces (`client`, `server`, `shared`) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd finance-tracker-coco

# Install all workspace dependencies
npm install
```

### Seed the Database

Creates the SQLite database with sample users, products, stock entries, sales, and expenses:

```bash
npm run seed --workspace=server
```

**Default credentials:**

| Username | Password | Role |
| --- | --- | --- |
| `owner` | `owner123` | OWNER |
| `staff` | `staff123` | STAFF |

### Run in Development

```bash
npm run dev
```

This starts both the Express API server and the Vite dev server concurrently:

| Service | URL |
| --- | --- |
| Client (Vite) | http://localhost:5173 |
| API Server | http://localhost:3001 |

The Vite dev server proxies `/api` requests to the Express server automatically.

### Build for Production

```bash
npm run build
```

Builds `shared` → `server` → `client` sequentially.

Then start the production server:

```bash
npm run start --workspace=server
```

## Available Scripts

### Root

| Script | Description |
| --- | --- |
| `npm run dev` | Start both server & client in dev mode |
| `npm run dev:server` | Start server only |
| `npm run dev:client` | Start client only |
| `npm run build` | Production build (shared → server → client) |
| `npm run lint` | Lint server & client concurrently |

### Server (`@coco/server`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start with tsx watch mode |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled JS (`dist/index.js`) |
| `npm run seed` | Seed database with sample data |

### Client (`@coco/client`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check & build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Shared (`@coco/shared`)

| Script | Description |
| --- | --- |
| `npm run build` | Compile shared types |
| `npm run dev` | Watch mode for shared types |

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | Server listen port |
| `JWT_SECRET` | `coco-tracker-dev-secret-change-in-prod` | JWT signing secret — **change in production** |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | — | Set to `development` for SQL logging and auto-migration |

No `.env` file is required for local development — defaults are built in.

## Project Structure

```
finance-tracker-coco/
├── package.json                       # Root — npm workspaces, dev scripts
├── tsconfig.base.json                 # Shared TypeScript config (strict, ES2022)
├── AGENTS.md                          # Architecture & domain documentation
│
├── shared/                            # @coco/shared — shared type definitions
│   └── types/
│       └── index.ts                   # All shared TypeScript interfaces
│
├── server/                            # @coco/server — Express REST API
│   └── src/
│       ├── index.ts                   # App bootstrap & route registration
│       ├── config/                    # Environment & database configuration
│       ├── database/
│       │   └── seed.ts                # Database seeding script
│       ├── middleware/                # JWT auth & global error handler
│       ├── models/                    # Sequelize model definitions & associations
│       ├── modules/                   # Feature modules (controller / service / routes)
│       │   ├── auth/                  # Login, register
│       │   ├── products/              # Product CRUD (owner only)
│       │   ├── sales/                 # Record, query, analytics
│       │   ├── stock/                 # Entries, levels, history
│       │   ├── expenses/              # Record, query, summary
│       │   ├── dashboard/             # Daily/weekly/monthly summaries
│       │   └── fraud/                 # Alerts & fraud dashboard (owner only)
│       └── utils/                     # AppError class, date-range helpers
│
├── client/                            # @coco/client — React SPA
│   └── src/
│       ├── App.tsx                    # Routing setup
│       ├── main.tsx                   # Entry point
│       ├── pages/                     # Dashboard, Sales, Stock, Expenses, Products, Login
│       ├── components/                # Layout, ProtectedRoute, reusable UI components
│       ├── hooks/                     # Custom hooks for data fetching
│       ├── services/
│       │   └── api.ts                 # Axios client with JWT interceptor
│       ├── context/
│       │   └── AuthContext.tsx         # Auth state provider
│       └── utils/
│           └── format.ts              # Currency (฿) & date formatting
│
└── data/                              # SQLite database file
```

## API Reference

All endpoints are prefixed with `/api`. Authenticated routes require a `Bearer <token>` header.

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Health check |

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | No | Login → JWT token |
| POST | `/api/auth/register` | No | Register new user |

### Products

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/products` | Yes | List all products |
| GET | `/api/products/:id` | Yes | Get single product |
| POST | `/api/products` | Owner | Create product |
| PUT | `/api/products/:id` | Owner | Update product |
| DELETE | `/api/products/:id` | Owner | Delete product |

### Sales

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/sales` | Yes | Record a sale |
| GET | `/api/sales/by-date?date=` | Yes | Sales by date |
| GET | `/api/sales/by-week?date=` | Yes | Sales by week |
| GET | `/api/sales/by-month?month=` | Yes | Sales by month |
| GET | `/api/sales/by-range?start=&end=` | Yes | Sales by custom range |
| GET | `/api/sales/analytics?period=&ref=` | Yes | Sales analytics & trends |
| DELETE | `/api/sales/:id` | Yes | Delete a sale |

### Stock

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/stock` | Yes | Add stock entry |
| GET | `/api/stock/levels` | Yes | Current stock levels |
| GET | `/api/stock/history/:productId` | Yes | Stock history for a product |

### Expenses

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/expenses` | Yes | Create expense |
| GET | `/api/expenses/by-date?date=` | Yes | Expenses by date |
| GET | `/api/expenses/fixed-by-month?month=` | Yes | Fixed monthly expenses |
| GET | `/api/expenses/summary?month=` | Yes | Monthly summary by category |
| DELETE | `/api/expenses/:id` | Yes | Delete expense |

### Dashboard

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/dashboard/daily?date=` | Yes | Daily summary |
| GET | `/api/dashboard/weekly?date=` | Yes | Weekly summary |
| GET | `/api/dashboard/monthly?month=` | Yes | Monthly summary with daily breakdown |
| GET | `/api/dashboard/report?month=` | Yes | Monthly profit report with comparison |
| GET | `/api/dashboard/custom?start=&end=` | Yes | Custom date range summary |

### Fraud

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/fraud/alerts` | Owner | List fraud alerts |
| GET | `/api/fraud/dashboard?days=` | Owner | Full fraud dashboard & analytics |

## Authentication & Roles

The app uses **JWT-based authentication**:

1. User logs in via `POST /api/auth/login` with username & password
2. Server returns a signed JWT (7-day expiry)
3. Client stores the token in `localStorage` and attaches it as a `Bearer` header on every request
4. Server middleware verifies the token and attaches the user context to the request

### Roles

| Role | Permissions |
| --- | --- |
| **OWNER** | Full access — manage products, view fraud alerts, all CRUD operations |
| **STAFF** | Record sales, add stock entries, add expenses, view dashboard |

## Key Conventions

- **Money** — All monetary values are stored as **integer cents (satang)**, never floats. Field names end with a `Cents` suffix (e.g., `totalRevenueCents`). Display conversion happens only at the UI layer.
- **API Responses** — Standard shape: `{ success: true, data: T }` or `{ success: false, error: string }`
- **Validation** — Zod schemas in controllers validate request bodies
- **Error Handling** — Custom `AppError` class + global `errorHandler` middleware; Zod errors return 400 with field-level messages
- **Tailwind Theme** — Primary: `emerald-600`, Accent: `amber-500`, Danger: `red-500`
- **TypeScript** — Strict mode, no `any`, path aliases (`@/`, `@shared/types`)
- **Module Pattern** — Each server feature has `controller.ts`, `service.ts`, and `routes.ts` colocated in `modules/<feature>/`

## License

Private — not licensed for redistribution.
