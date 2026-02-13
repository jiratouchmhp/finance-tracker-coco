---
name: run-and-fix
description: Run the dev server, capture compile/runtime errors, and fix them iteratively
tools:
  - terminalLastCommand
  - problems
  - editFiles
  - search
---

# Run and Fix

Start the development server and fix any errors found.

## Steps

1. Run `npm run dev` from the workspace root
2. Check #tool:problems for TypeScript compile errors
3. Read terminal output for runtime errors or crash messages
4. For each error:
   a. Identify the root cause
   b. Fix the code
   c. Verify the fix compiles (re-check #tool:problems)
5. Repeat until the app starts successfully with zero errors

## Priority

Fix errors in this order:
1. Import/module resolution errors
2. Type errors
3. Runtime errors (missing env vars, DB connection, etc.)
4. Warnings (address only if blocking)
