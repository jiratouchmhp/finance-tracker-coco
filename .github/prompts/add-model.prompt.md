---
name: add-model
description: Add a new Sequelize model with proper types, associations, and shared type export
agent: backend
tools:
  - editFiles
  - search
---

# Add Sequelize Model

Create a new Sequelize model for `${input:modelName}`.

## Steps

1. Create `server/src/models/${input:modelName}.ts` with Sequelize `DataTypes` column definitions
2. Enable `timestamps: true` and `underscored: true`
3. All money fields must use `DataTypes.INTEGER` with names ending in `Cents`
4. Define associations in `server/src/models/index.ts`
5. Export the TypeScript interface to `shared/types/index.ts`

## Pattern

Follow the model conventions in [Express backend instructions](../instructions/express-backend.instructions.md).

```typescript
// Example pattern
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class ModelName extends Model { /* typed fields */ }

ModelName.init({ /* columns */ }, { sequelize, modelName: 'modelName', underscored: true });
```
