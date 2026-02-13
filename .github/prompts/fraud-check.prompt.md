---
name: fraud-check
description: Implement or debug a fraud detection rule for stock and revenue cross-checking
agent: backend
tools:
  - editFiles
  - search
---

# Fraud Detection Rule

Implement a fraud detection rule in `server/src/modules/fraud/`.

## Rule to Implement

${input:ruleDescription}

## Steps

1. Add the detection logic in `server/src/modules/fraud/fraud.service.ts`
2. Query `StockEntry` and `Sale` records from Sequelize models
3. Compare quantities/amounts to find discrepancies
4. Return an array of `FraudAlert` objects

## FraudAlert Shape

```typescript
interface FraudAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  type: string;
  description: string;
  detectedAt: string;
  affectedDateRange: { from: string; to: string };
  relatedRecordIds: string[];
}
```

## Pattern

Follow [Express backend instructions](../instructions/express-backend.instructions.md) for service patterns.

All amount comparisons must use integer cents — see [global rules](../copilot-instructions.md).
