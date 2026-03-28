# API Documentation

## Overview

This microservices architecture provides a scalable, production-ready backend system with three core services:

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Service Auth │  │ Service User │  │  Service Product     │   │
│  │   Port 3100  │  │   Port 3101  │  │    Port 3102         │   │
│  │              │  │              │  │                      │   │
│  │ - Login      │  │ - User CRUD  │  │ - Product CRUD       │   │
│  │ - Logout     │  │ - Profiles   │  │ - Search/Filter      │   │
│  │ - Sessions   │  │ - Admin ops  │  │ - Variants/Attrs     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Links

| Service             | Description                         | Base URL                | Documentation                                      |
| ------------------- | ----------------------------------- | ----------------------- | -------------------------------------------------- |
| **Auth Service**    | Authentication & Session Management | `http://localhost:3100` | [service-auth-api.md](./service-auth-api.md)       |
| **User Service**    | User Management & Profiles          | `http://localhost:3101` | [service-user-api.md](./service-user-api.md)       |
| **Product Service** | Product Catalog & Marketplace       | `http://localhost:3102` | [service-product-api.md](./service-product-api.md) |

---

## Architecture

### Service Responsibilities

| Service     | Responsibility                                                   |
| ----------- | ---------------------------------------------------------------- |
| **Auth**    | JWT token issuance, session validation, user authentication      |
| **User**    | User data storage, profile management, admin operations          |
| **Product** | Product catalog, variants, attributes, marketplace functionality |

### Communication Patterns

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ Auth Service│────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼ (JWT Token)
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ User Service│────▶│  Database   │
│  (w/ Token) │     │             │     └─────────────┘
└─────────────┘     └─────────────┘            │
                          │                    ▼
                          │           ┌──────────────┐
                          └──────────▶│ User Sessions│
                                      └──────────────┘

┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│   Client    │────▶│Product Service│────▶│  Database    │
│  (w/ Token) │     │               │     └──────────────┘
└─────────────┘     └───────────────┘
                          │
                          ▼ (Internal API)
                   ┌──────────────┐
                   │ User Service │
                   │ (get owner)  │
                   └──────────────┘
```

---

## Common Standards

### Response Format

All services follow a standardized JSON response format:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### Authentication

#### JWT Authentication (User Requests)

**Header:**

```
Authorization: Bearer <jwt-token>
```

**Token Structure:**

```typescript
{
  sub: string,      // User ID
  email: string,    // User email
  role: "ADMIN" | "USER",
  jti: string,      // Session ID
  iat: number,      // Issued at
  exp: number       // Expires at (1 day after issuance)
}
```

#### System Authentication (Service-to-Service)

**Header:**

```
Authorization: Basic <base64(SYSTEM_USER:SYSTEM_PASS)>
```

**Environment Variables:**

- `SYSTEM_USER`: System username (default: `admin`)
- `SYSTEM_PASS`: System password (default: `admin123`)

---

## Error Codes Reference

| Code                       | HTTP | Description                       | Services            |
| -------------------------- | ---- | --------------------------------- | ------------------- |
| `UNAUTHORIZED`             | 401  | Authentication required or failed | All                 |
| `FORBIDDEN`                | 403  | Insufficient permissions          | User, Product       |
| `NOT_FOUND`                | 404  | Resource not found                | All                 |
| `USER_NOT_FOUND`           | 404  | User does not exist               | Auth, User          |
| `PRODUCT_NOT_FOUND`        | 404  | Product does not exist            | Product             |
| `USER_ALREADY_DELETED`     | 400  | User already soft-deleted         | User                |
| `USER_ALREADY_ACTIVE`      | 400  | User already active               | User                |
| `USER_DELETE_FORBIDDEN`    | 403  | Cannot delete self or other admin | User                |
| `ACCESS_DENIED`            | 403  | User cannot access resource       | Product             |
| `INVALID_CREDENTIALS`      | 401  | Wrong username/password           | Auth                |
| `INVALID_ROLE`             | 400  | Invalid role parameter            | User                |
| `INVALID_SESSION`          | 401  | Session ID missing in token       | Auth                |
| `RATE_LIMITED`             | 429  | Too many requests                 | Auth, User, Product |
| `PRODUCT_CREATE_FAILED`    | 400  | Product validation failed         | Product             |
| `PRODUCT_UPDATE_FAILED`    | 400  | Product update validation failed  | Product             |
| `PRODUCT_DELETE_FAILED`    | 400  | Product deletion failed           | Product             |
| `PRODUCT_ALREADY_DELETED`  | 400  | Product already deleted           | Product             |
| `PRODUCT_ALREADY_ACTIVE`   | 400  | Product already active            | Product             |
| `PRODUCT_FETCH_FAILED`     | 500  | Failed to fetch products          | Product             |
| `PRODUCT_RESTORE_FAILED`   | 500  | Product restoration failed        | Product             |
| `USER_CREATE_FAILED`       | 400  | User creation validation failed   | User                |
| `USER_FETCH_FAILED`        | 500  | Failed to fetch users             | User                |
| `USER_DELETE_FAILED`       | 500  | User deletion failed              | User                |
| `USER_RESTORE_FAILED`      | 500  | User restoration failed           | User                |
| `FETCH_OLDEST_USER_FAILED` | 500  | Failed to fetch oldest user       | User                |
| `NETWORK_ERROR`            | 0    | Service unreachable               | Internal            |
| `SERVICE_UNHEALTHY`        | 503  | Service health check failed       | All                 |

---

## Getting Started

### 1. Local Development Setup

```bash
# Install dependencies
bun install

# Start all services (in separate terminals)
cd service-auth && bun run dev    # Port 3100
cd service-user && bun run dev    # Port 3101
cd service-product && bun run dev # Port 3102
```

### 2. Health Checks

```bash
# Public health checks
curl http://localhost:3100/health
curl http://localhost:3101/health
curl http://localhost:3102/health

# Admin health checks (requires system auth)
curl -u admin:admin123 http://localhost:3100/admin/health
curl -u admin:admin123 http://localhost:3101/admin/health
curl -u admin:admin123 http://localhost:3102/admin/health
```

### 3. Authentication Flow

```bash
# Step 1: Login to get JWT token
TOKEN=$(curl -X POST http://localhost:3100/auth/login \
  -H "Authorization: Basic $(echo -n 'user@example.com:Password123!' | base64)" \
  | jq -r '.data.token')

# Step 2: Use token for authenticated requests
curl http://localhost:3101/me \
  -H "Authorization: Bearer $TOKEN"

curl http://localhost:3102/products \
  -H "Authorization: Bearer $TOKEN"
```

---

## Data Models

### User Model

```typescript
interface User {
  id: string; // UUID
  email: string; // Unique, valid email
  username: string; // Unique, 3-50 chars
  name: string | null; // Optional display name
  role: "ADMIN" | "USER";
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete timestamp
}
```

### Product Model

```typescript
interface Product {
  id: string; // UUID
  name: string; // 1-255 chars
  price: number; // Positive integer (cents)
  ownerId: string; // User UUID (owner)
  stock: number; // Current stock
  hasVariant: boolean; // Has product variants
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete timestamp
}
```

### Session Model

```typescript
interface UserSession {
  id: string; // UUID
  userId: string; // User UUID
  token: string; // JWT token
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  expiresAt: Date;
  lastUsedAt: Date;
}
```

---

## Service Port Mapping

| Service | Development | Production   | Description             |
| ------- | ----------- | ------------ | ----------------------- |
| Auth    | 3100        | Configurable | Authentication service  |
| User    | 3101        | Configurable | User management service |
| Product | 3102        | Configurable | Product catalog service |

---

## Database Schema

All services use PostgreSQL with Drizzle ORM:

| Service | Database    | Tables                                               |
| ------- | ----------- | ---------------------------------------------------- |
| Auth    | `cqrs_demo` | `user_sessions`, `user_activity_logs`                |
| User    | `cqrs_demo` | `users`, `user_sessions`, `user_activity_logs`       |
| Product | `cqrs_demo` | `products`, `product_attributes`, `product_variants` |

---

## Rate Limiting

Rate limiting is implemented per-route to prevent abuse:

| Service | Endpoint | Limit |
|---------|----------|-------|
| Auth | `/auth/login` | 10 requests / 60s |
| Auth | `/auth/logout` | 30 requests / 60s |
| User | `/me` | 120 requests / 60s |
| User | `/admin/users` (GET) | 120 requests / 60s |
| User | `/admin/users` (POST) | 10 requests / 60s |
| User | `/admin/users/:id` (DELETE) | 5 requests / 60s |

Rate limit responses return HTTP 429 with `RATE_LIMITED` error code.

---

## Versioning

Current API Version: `v1.0.0`

Changelog:

- **v1.0.0** (2024-02-21): Initial release

---

## Support

For issues, questions, or contributions:

- Repository: [GitHub]
- Documentation: `/docs/api-documentation/`

---

**Last Updated:** 2026-02-21
**Documentation Version:** 1.0.0
