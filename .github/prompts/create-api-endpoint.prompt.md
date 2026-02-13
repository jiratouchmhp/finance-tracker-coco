---
name: create-api-endpoint
description: Scaffold a new Express API module with controller, service, and routes
agent: backend
tools:
  - editFiles
  - search
---

# Create API Endpoint

Scaffold a complete API module for `${input:featureName}`.

## Steps

1. Create `server/src/modules/${input:featureName}/service.ts` — business logic with typed inputs/outputs
2. Create `server/src/modules/${input:featureName}/controller.ts` — thin controller that parses request, calls service, sends response
3. Create `server/src/modules/${input:featureName}/routes.ts` — Express Router with endpoints and middleware
4. Register the routes in `server/src/index.ts`
5. Export any new response/request types to `shared/types/index.ts`

## Pattern Reference

Follow the module structure defined in [Express backend instructions](../instructions/express-backend.instructions.md).

Use the standard API response format: `{ success: boolean, data?: T, error?: string }`.
