# Coco Tracker — Coconut Water Shop Finance Tracker

## Purpose

A finance tracking application for a coconut water shop that summarizes daily/monthly revenue, tracks costs and stock, detects fraud through cross-checking, and displays profit breakdowns on a dashboard.

## Architecture

Monorepo with three top-level directories:

- **`client/`** — React 19 + Tailwind CSS + Vite frontend SPA
- **`server/`** — Express.js REST API with Sequelize ORM + SQLite database
- **`shared/`** — TypeScript type definitions shared between client and server

## Data Flow

```
React Page → Custom Hook → API Service (Axios) → Express Controller → Service Layer → Sequelize Model → SQLite
```

## Domain Glossary

| Term | Definition |
|---|---|
| Revenue | Total income from coconut water sales (sum of all Sale records) |
| COGS | Cost of Goods Sold — purchase cost of products sold |
| Gross Profit | Revenue minus COGS |
| Labor Cost | Wages and staff-related expenses |
| Net Profit | Revenue minus all expenses (COGS + Labor + Utilities + Other) |
| Stock Entry | A record of inventory added (purchase from supplier) |
| Sale Record | A record of a product sold to a customer |
| Fraud Alert | A discrepancy detected between stock movements and sales records |
| Expense | Any cost incurred: labor, ingredients, utilities, or other |

## Folder Map

```
client/src/pages/         → Page components (Dashboard, Sales, Stock, etc.)
client/src/components/ui/ → Reusable UI components (Card, Button, Table, etc.)
client/src/hooks/         → Custom React hooks for data fetching
client/src/services/      → API client (Axios instance + typed functions)
client/src/context/       → React context providers (Auth)
server/src/modules/       → Feature modules (auth, sales, stock, expenses, dashboard, fraud)
server/src/models/        → Sequelize model definitions
server/src/middleware/     → Express middleware (auth, error handler, validation)
server/src/config/        → App and database configuration
shared/types/             → TypeScript interfaces shared across client and server
```

## Roles

| Role | Access |
|---|---|
| OWNER | Full access: manage products, view fraud alerts, all CRUD operations |
| STAFF | Record sales, add stock entries, add expenses, view dashboard |

## Key Business Rules

- All monetary values are stored as integer cents (satang) to avoid floating-point errors
- Stock must be validated against sales — selling more than available stock triggers a fraud alert
- Daily summaries are materialized for fast dashboard rendering
- Monthly profit = Total Revenue − COGS − Labor − Utilities − Other Expenses
