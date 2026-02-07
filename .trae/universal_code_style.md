# Universal Code Style Standards

This document defines the universal code style standards for the project. The AI model MUST adhere to these guidelines when generating or modifying code.

## 1. Formatting & Layout

**Severity: High (Automated via Prettier)**

- **Indentation**: 2 spaces.
- **Line Length**: Max 100 characters.
- **Quotes**: Single quotes for strings (unless avoiding escaping).
- **Semicolons**: Required.
- **Trailing Commas**: ES5 compatible.
- **Imports**:
  - Group external dependencies first.
  - Internal project imports second.
  - Relative imports last.
  - Remove unused imports immediately.

## 2. Naming Conventions

**Severity: High**

- **Files**:
  - Classes/Components: `PascalCase.ts` (e.g., `ProductRepository.ts`)
  - Utilities/Functions: `camelCase.ts` or `kebab-case.ts` (consistent within module).
  - Configs: `kebab-case.json` or `camelCase.ts`.
- **Code Symbols**:
  - Classes/Interfaces/Types: `PascalCase`.
  - Variables/Functions/Methods: `camelCase`.
  - Constants (Global/Config): `UPPER_SNAKE_CASE`.
  - Booleans: Prefix with `is`, `has`, `should` (e.g., `isValid`, `hasPermission`).
  - Private Properties: No `_` prefix (use TypeScript `private` keyword).

## 3. File Organization

**Severity: Medium**

- **Module Structure**:
  - Exports at the bottom or inline (consistency per file).
  - Helper functions at the bottom of the file (if local).
- **Directories**:
  - Group by Feature (preferred) or Type (e.g., `controllers`, `services` vs `modules/auth`).
  - Use `index.ts` (Barrel files) sparingly to clean up imports, but avoid circular dependencies.

## 4. Language Specifics (TypeScript)

**Severity: High**

- **Type Safety**:
  - **NO** `any` type allowed. Use `unknown` if necessary and narrow types.
  - Explicit return types for all exported functions.
  - Use `interface` for object definitions, `type` for unions/primitives.
- **Async/Await**:
  - Prefer `async/await` over `.then()/.catch()`.
  - Always wrap top-level async calls in `try/catch` or use a global error handler.
- **Null Checks**:
  - Use Optional Chaining (`?.`) and Nullish Coalescing (`??`).

## ✅ Implementation Checklist (AI Usage)

When generating code, the AI must verify:

- [ ] Are naming conventions (PascalCase vs camelCase) applied correctly?
- [ ] Are all imports used and ordered correctly?
- [ ] Is `any` type avoided?
- [ ] Are return types explicit for exported functions?
- [ ] Is the file formatted according to 2-space indentation rules?
