# Implementation Roadmap & Best Practices

This roadmap details the steps to refactor the project, with a strong focus on Drizzle ORM best practices and clean configuration.

## Phase 1: Preparation & Infrastructure

### Required Tools & Resources

- **Tool**: `LS` - To list current directories and verify `apps/` content.
- **Tool**: `RunCommand` - Use `mkdir` to create root services.
- **Tool**: `DeleteFile` - To remove `apps/` and `packages/` after migration.

1.  **Backup**: Ensure current code is committed.

2.  **Clean Slate**:
    - Create the new root directories (`auth-service`, `user-service`, `product-service`).
    - **Action**: Delete/Archive the `apps/` folder once code is migrated.
    - **Action**: Remove complex `tsconfig.json` paths mapping. Use standard module resolution.
3.  **Infrastructure**:
    - Move `infra` folder to root.
    - Update `docker-compose.yml` to point to new build contexts.

## Phase 2: Drizzle ORM Implementation (Detailed)

### Required Tools & Resources

- **Tool**: `WebSearch` - Use query "drizzle-kit config reference" or "drizzle orm postgres connection" if you encounter connection errors.
- **Tool**: `RunCommand` - Execute `bun run db:generate` and `bun run db:migrate`.
- **Tool**: `Read` - Read the generated `.sql` files in `./drizzle` folder to verify they match your schema expectations.

For each service (`user-service`, `product-service`), follow this exact Drizzle workflow to ensure type safety and migration stability.

### 1. Configuration (`drizzle.config.ts`)

Each service must have its own config. Do not share a single config across services.

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/modules/**/schema.ts', // Locate schemas collocated with modules
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### 2. Migration Workflow

- **Development**:
  - Change schema in TypeScript.
  - Run `bun run db:generate` (wraps `drizzle-kit generate`).
  - Review the generated SQL in `./drizzle`.
  - Run `bun run db:migrate` (wraps `drizzle-kit migrate`).
- **CI/CD**:
  - Run `drizzle-kit check` to ensure schema matches migrations.
  - Run `migrate` command on deployment.

### 3. Continuous Migration Checking

To prevent drift, add a check script in `package.json`:

```json
"scripts": {
  "db:check": "drizzle-kit check",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

### 4. Seeding

Keep seeding simple. Avoid complex seed managers. Create a `seed.ts` in each service:

```typescript
// src/scripts/seed.ts
import { db } from '../db';
import { users } from '../modules/user/schema';

async function main() {
  await db.insert(users).values([...]);
  process.exit(0);
}
main();
```

## Phase 3: Service Refactoring (CQRS)

### Required Tools & Resources

- **Tool**: `SearchCodebase`
  - **Query**: "user repository", "product controller"
  - **Goal**: Find existing logic in `apps/` to copy over. Don't rewrite from scratch if you can refactor existing code.
- **Tool**: `Write`
  - **Usage**: Create new files in `modules/[name]/repositories/commands/`.
- **Tool**: `RunCommand`
  - **Usage**: Run tests for the specific service (e.g., `cd user-service && bun test`) to verify the CQRS logic works.

### User Service

1.  **Migration**: Move `apps/user-service` code to `user-service/`.
2.  **CQRS Structure**:
    - `modules/user/repositories/commands`: Write logic (Insert, Update, Delete).
    - `modules/user/repositories/queries`: Read logic (Select).
    - **Rule**: Commands return minimal data (IDs). Queries return DTOs.
3.  **Clean Code**:
    - Use `paranoid` tables (Soft Delete) as per best practices.
    - Document complex queries with JSDoc explaining _why_ a specific join is used.

### Product Service

1.  **Migration**: Move `apps/product-service` code to `product-service/`.
2.  **CQRS Structure**: Mirror User Service.
3.  **Kafka Integration**:
    - Producers in `modules/product/events/`.
    - Consumers in `modules/product/events/consumers/`.

## Phase 4: Configuration & Linting

### Required Tools & Resources

- **Tool**: `Read` - Check `tsconfig.json` to ensure `paths` are removed.
- **Tool**: `RunCommand` - Run `bun run lint` in the root.
- **Tool**: `WebSearch` - If lint errors persist, search the specific ESLint error code (e.g., "eslint rule no-unused-vars typescript") to find the correct `.eslintrc.json` configuration.

To avoid "ESLint hell":

1.  **Root ESLint**: Use a simple, root-level `.eslintrc.json` that applies to all services.
2.  **TSConfig**:
    - Use a base `tsconfig.json` in root.
    - Services `extend` the root config.
    - **Crucial**: Set `"skipLibCheck": true` and `"strict": true` for sanity.
3.  **Dependencies**:
    - Upgrade `drizzle-orm` to latest stable.
    - Upgrade `hono` to latest v3/v4.
    - Upgrade `bun` types.

## Phase 5: Auth Service (Gateway)

### Required Tools & Resources

- **Tool**: `WebSearch` - Search "hono jwt middleware" to implement secure token validation.
- **Tool**: `SearchCodebase` - Check if there is existing auth logic in `apps/` that can be reused.

1.  **Role**: Pure API Gateway + Auth Provider.

2.  **Logic**:
    - Validates Login credentials -> Issues JWT.
    - Does **not** talk to Kafka.
    - Can proxy requests to User/Product services if needed, or Clients talk directly using the JWT.

## Final Review Checklist

- [ ] All `apps/` code moved to root services.
- [ ] `package.json` scripts are clean (under 10 scripts per service).
- [ ] Drizzle `generate` and `migrate` work independently for each service.
- [ ] ESLint runs without errors.
- [ ] `docker-compose up` launches all 3 services + DB + Kafka + Zookeeper.
