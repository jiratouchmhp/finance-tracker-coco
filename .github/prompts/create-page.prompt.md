---
name: create-page
description: Scaffold a new React page with Tailwind styling, custom hook, and routing
agent: frontend
tools:
  - editFiles
  - search
---

# Create Page

Scaffold a new page for `${input:pageName}`.

## Steps

1. Create `client/src/pages/${input:pageName}.tsx` — page component with Tailwind layout
2. Create `client/src/hooks/use${input:pageName}.ts` — custom hook for data fetching (loading, error, data states)
3. Add the route to `client/src/App.tsx` inside the router configuration
4. Import types from `shared/types/` for API response typing

## Requirements

- Include loading spinner/skeleton while data loads
- Show error message on fetch failure
- Responsive layout: mobile-first with `md:` breakpoints
- Use the project's Tailwind theme (emerald primary, amber accent)

Follow [React frontend instructions](../instructions/react-frontend.instructions.md) for component patterns.
