# Global Coding Standards — Coco Tracker

## TypeScript

- Use TypeScript strict mode (`"strict": true` in tsconfig)
- Never use `any` — use `unknown` and narrow with type guards when type is uncertain
- Prefer explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions/intersections

## Money Handling

- All monetary values stored as **integer cents** (satang), never floats
- Field names end with `Cents` suffix: `totalRevenueCents`, `costPriceCents`
- Convert to display format only at the UI layer: `(cents / 100).toFixed(2)`
- Arithmetic on cents only — never divide then multiply

## Naming Conventions

- `PascalCase` — React components, TypeScript interfaces/types, Sequelize models, class names
- `camelCase` — functions, variables, object properties, hook names
- `UPPER_SNAKE_CASE` — constants, enum values
- File names: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components

## Error Handling

- Always type errors: catch blocks use `unknown`, then narrow
- Never swallow exceptions silently — at minimum log them
- API errors return `{ success: false, error: string }` with appropriate HTTP status
- Frontend shows user-friendly error messages, logs technical details to console

## Testing

- Colocate test files next to source: `service.ts` → `service.test.ts`
- Name test files `*.test.ts` or `*.test.tsx`
- Test behavior, not implementation details

## Imports

- Use path aliases: `@shared/types` for shared types, `@/` for src-relative paths
- Group imports: 1) external packages, 2) shared types, 3) local modules
- No circular imports between modules

## Git Commits

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Keep commits focused on a single change

## Code Organization

- Use descriptive file paths — `src/modules/sales/service.ts` not `src/utils/s.ts`
- Colocate related code — keep controller, service, routes in the same module folder
- Export public APIs from index files when a module has multiple consumers
- Define constants with semantic names — `MAX_STOCK_ALERT_THRESHOLD = 10` not magic number `10`
