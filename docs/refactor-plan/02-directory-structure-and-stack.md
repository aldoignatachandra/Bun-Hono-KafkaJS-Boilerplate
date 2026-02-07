# Directory Structure & Tech Stack

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) (v1.x) - Fast JavaScript runtime.
- **Web Framework**: [Hono](https://hono.dev) - Ultrafast web framework for the Edges.
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM.
- **Database**: PostgreSQL (per existing docker-compose).
- **Message Broker**: Apache Kafka (using `kafkajs`).
- **Containerization**: Docker & Docker Compose.
- **Validation**: Zod (or Hono's validator).
- **Language**: TypeScript.

## Cleanup Strategy

Before/During the refactor, the following directories and files should be cleaned up or migrated to avoid "eslint hell" and confusion.

### **Delete / Archive**

- `apps/` - Content will be moved to root-level service folders (`user-service`, `product-service`).
- `config/` - Old config files (move to environment variables or service-specific `config.ts`).
- `packages/` - If choosing a "Shared Nothing" architecture (recommended for strict decoupling), code in `packages/common` should be duplicated or moved to a shared library that is strictly versioned. For this refactor, we will move shared logic to `helpers/` within each service or a simplified `shared/` root folder if absolutely necessary.
- `.trae/` - Review rules, but generally start fresh with standard linting rules.

### **Update**

- `tsconfig.json`: Needs to be stripped of complex `paths` mapping if we stop using monorepo workspaces in favor of root-level services.
- `package.json`: Needs massive simplification (see below).

## Proposed Directory Structure

The project will move from `apps/*` to root-level service directories to ensure clear separation.

```
/
├── .github/                # CI/CD workflows
├── auth-service/           # Auth & Gateway Service
│   ├── src/
│   │   ├── bin/            # Entry point (server.ts)
│   │   ├── config/         # Environment config
│   │   ├── modules/
│   │   │   └── auth/
│   │   │       ├── handlers/
│   │   │       ├── repositories/
│   │   │       └── usecases/
│   │   ├── middlewares/    # Auth middleware, Rate limiters
│   │   └── helpers/        # Shared utils
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── user-service/           # User Domain Service
│   ├── src/
│   │   ├── bin/
│   │   ├── config/
│   │   ├── modules/
│   │   │   └── user/
│   │   │       ├── handlers/       # HTTP Controllers
│   │   │       ├── repositories/
│   │   │       │   ├── commands/   # Write Operations (Drizzle)
│   │   │       │   └── queries/    # Read Operations (Drizzle)
│   │   │       └── domain/         # Domain Models/Types
│   │   ├── events/         # Kafka Producers/Consumers
│   │   └── helpers/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── product-service/        # Product Domain Service
│   ├── src/
│   │   ├── bin/
│   │   ├── config/
│   │   ├── modules/
│   │   │   └── product/
│   │   │       ├── handlers/
│   │   │       ├── repositories/
│   │   │       │   ├── commands/
│   │   │       │   └── queries/
│   │   │       └── domain/
│   │   ├── events/
│   │   └── helpers/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── infra/                  # Shared Infrastructure
│   ├── docker/
│   └── kafka/
│
├── docs/                   # Documentation
├── package.json            # Root workspace config
├── bun.lockb
└── docker-compose.yml
```

## Simplified Root `package.json`

We will avoid the "script explosion" seen in the current project. The root `package.json` should only orchestrate the entire system.

```json
{
  "name": "bun-hono-kafka-cqrs",
  "version": "2.0.0",
  "workspaces": ["auth-service", "user-service", "product-service"],
  "scripts": {
    "dev": "bun run --parallel dev:*",
    "build": "bun run --parallel build:*",
    "test": "bun run --parallel test:*",
    "lint": "bun run --parallel lint:*",
    "db:generate": "bun run --parallel db:generate:*",
    "db:migrate": "bun run --parallel db:migrate:*",
    "db:seed": "bun run --parallel db:seed:*",
    "clean": "rm -rf node_modules **/node_modules dist **/dist"
  },
  "devDependencies": {
    "bun-types": "latest",
    "typescript": "^5.0.0"
  }
}
```

_Note: Each service (`user-service`, etc.) will have its own specific `db:migrate` script that points to its own Drizzle config._

## Implementation Tooling Guide

To prevent hallucination and ensure the directory structure is exact, use the following tools:

### 1. Dependency Verification

- **Tool**: `WebSearch`
  - **Usage**: Before adding `drizzle-orm` or `hono` to `package.json`, search "latest stable version drizzle-orm" or "latest hono version" to ensure we are using secure, up-to-date packages. **Do not guess versions.**
- **Tool**: `Read`
  - **Usage**: Read `bun.lockb` (if possible) or existing `package.json` to see what versions were previously used, but prefer upgrading to stable if the user requested "newest and secure".

### 2. Structure Validation

- **Tool**: `LS` or `RunCommand` (`ls -R` or `tree`)
  - **Usage**: Frequently check the file system state.
  - **Check**: Verify that `apps/` is empty or deleted after migration. Verify that `user-service/src/modules/user/repositories/commands` exists.
- **Tool**: `DeleteFile`
  - **Usage**: Explicitly use this to remove `apps/`, `config/`, and `packages/` ONLY AFTER you have confirmed their contents have been successfully migrated to the new services.

### 3. Config Cleanup

- **Tool**: `Read`
  - **Usage**: Read the final `tsconfig.json` to ensure no `paths` ("@common/\*") remain.
- **Tool**: `RunCommand` (`bun run lint`)
  - **Usage**: Run linting immediately after changing config to prove that "ESLint hell" is gone.
