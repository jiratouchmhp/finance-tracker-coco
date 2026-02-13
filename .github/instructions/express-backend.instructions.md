---
name: Express Backend
description: Express.js + Sequelize patterns for the Coco Tracker server API
applyTo: 'server/**'
---

# Express Backend Standards

For TypeScript rules and money-handling conventions, see [global rules](../copilot-instructions.md).

## Module Structure

Each feature lives in `server/src/modules/<feature>/` with:

- `controller.ts` — Parse request params/body, call service, send response
- `service.ts` — All business logic, receives typed inputs, returns typed results
- `routes.ts` — Express Router defining endpoints, applying middleware

Register each module's routes in `server/src/index.ts`.

## Controller Rules

- Controllers are thin — no business logic
- Parse and validate input using zod schemas
- Call service methods, wrap response in standard format
- Always use `try/catch` with `next(error)` for error propagation

## Service Rules

- All business logic lives here
- Receive plain typed objects, not Express Request
- Return typed results, throw typed errors
- Use Sequelize transactions for operations touching multiple tables

## API Response Format

All endpoints return:
```json
{ "success": true, "data": <T> }
{ "success": false, "error": "Human-readable error message" }
```

## Sequelize Models

- Defined in `server/src/models/` — one file per model
- Use `DataTypes` for column definitions, enable `timestamps: true`
- Money columns: `DataTypes.INTEGER` with field names ending in `Cents`
- Define associations in a central `server/src/models/index.ts` after all models are imported
- Use `{ underscored: true }` for snake_case column names in SQLite

## Authentication

- JWT-based: issue token on login, verify via `requireAuth` middleware
- Middleware in `server/src/middleware/auth.ts`
- `requireAuth()` — verifies JWT, attaches `req.user`
- `requireRole('OWNER')` — checks `req.user.role` after `requireAuth`
- Passwords hashed with bcryptjs (min 10 salt rounds)

## Validation

- Use zod schemas to validate request bodies in controllers
- Return 400 with field-level error messages on validation failure
- Sanitize string inputs (trim whitespace)

## Error Handling

- Global error handler middleware in `server/src/middleware/errorHandler.ts`
- Catches all errors, logs with context, returns standard error response
- Use custom `AppError` class with `statusCode` and `message`
