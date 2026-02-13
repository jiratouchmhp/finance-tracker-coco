---
name: create-component
description: Scaffold a reusable React UI component with Tailwind CSS and TypeScript props
agent: frontend
tools:
  - editFiles
---

# Create Component

Create a reusable UI component `${input:componentName}`.

## Steps

1. Create `client/src/components/ui/${input:componentName}.tsx`
2. Define a `${input:componentName}Props` interface with all props typed
3. Build the component with Tailwind CSS classes
4. Export as a named export

## Requirements

- Use the project's Tailwind theme tokens (emerald-600, amber-500, red-500)
- Accept `className` prop for composition: `className?: string`
- Use semantic HTML elements
- Keep it generic and reusable — no business logic inside UI components

Follow [React frontend instructions](../instructions/react-frontend.instructions.md) for component patterns.
