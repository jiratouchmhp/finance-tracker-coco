---
name: React Frontend
description: React + Tailwind CSS patterns for the Coco Tracker client app
applyTo: 'client/**'
---

# React Frontend Standards

For TypeScript rules and money-handling conventions, see [global rules](../copilot-instructions.md).

## Component Patterns

- Functional components with hooks only — no class components
- One component per file, named export matching filename
- Props defined as `interface {ComponentName}Props` above the component
- Destructure props in function signature
- Use `React.FC` sparingly — prefer explicit return type `JSX.Element`

## Project Structure

- Pages in `client/src/pages/` — one file per route (Dashboard.tsx, Sales.tsx, etc.)
- Reusable UI in `client/src/components/ui/` — generic building blocks (Card, Button, Table)
- Feature components in `client/src/components/` — composed from UI components
- Custom hooks in `client/src/hooks/` — prefixed with `use` (useSales, useAuth)
- API layer in `client/src/services/api.ts` — Axios instance with JWT interceptor

## Tailwind CSS Theme

- Primary: `emerald-600` (coconut green)
- Accent: `amber-500` (warm highlight)
- Danger: `red-500` (alerts, fraud warnings)
- Background: `gray-50` (light) / `gray-900` (dark)
- Cards: `white` with `shadow-sm rounded-xl p-6`
- Use Tailwind utility classes directly — no custom CSS files unless absolutely necessary
- Responsive: mobile-first approach with `sm:`, `md:`, `lg:` breakpoints

## State Management

- `useState` / `useReducer` for local component state
- `AuthContext` via `client/src/context/AuthContext.tsx` for auth state and JWT
- Custom hooks wrapping API calls for server state (no Redux needed at this scale)
- Lift state up only when sibling components need the same data

## Data Fetching

- Custom hooks that call `api.ts` functions and manage `loading`, `error`, `data` states
- Show skeleton/spinner during loading, error message on failure
- Refresh data after mutations (optimistic updates optional)

## Routing

- React Router v7 with `<BrowserRouter>`
- Protected routes via `<ProtectedRoute>` wrapper checking `AuthContext`
- Owner-only routes check `user.role === 'OWNER'`

## Forms

- Controlled components with `useState` for form fields
- Validate before submit — disable submit button until valid
- Show inline validation errors below each field
- Reset form after successful submission

## Display Money

- Import shared formatting utility — never format cents inline
- Display: `formatCurrency(amountCents)` → `"฿12.50"` or appropriate locale
