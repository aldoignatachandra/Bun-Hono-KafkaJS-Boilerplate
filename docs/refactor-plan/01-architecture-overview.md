# Architecture Overview

## Introduction

This document outlines the architectural plan to refactor the `bun-hono-kafkajs-boilerplate` project. The goal is to transition from a monorepo structure with shared apps to a more scalable, decoupled microservices architecture inspired by the CQRS pattern observed in `hunianaja` projects.

## Core Concepts

### 1. Service Decomposition

The application will be split into three distinct, root-level services. This structure mimics "Repo-per-service" organization within a single repo for ease of management.

- **Auth Service (Gateway)**:
  - **Role**: The primary entry point and Security Gatekeeper.
  - **Responsibilities**:
    - **Authentication**: Login, Register, Forgot Password.
    - **Authorization**: Validating Tokens (JWT) and issuing them.
    - **Gateway**: Can act as a proxy for other services, or simply provide the Auth tokens clients need to access other services directly.
  - **Connectivity**: HTTP (REST) only. **No Kafka**. This ensures the Auth service is lightweight, stateless, and can scale massively to handle "front-door" traffic.

- **User Service**:
  - **Role**: Domain Service for User Management.
  - **Responsibilities**: User profiles, roles, permissions management.
  - **Pattern**: CQRS (Command Query Responsibility Segregation).
  - **Connectivity**: HTTP (internal/external), Kafka (Producer/Consumer).
  - **Database**: Own schema in PostgreSQL (users table).

- **Product Service**:
  - **Role**: Domain Service for Product Management.
  - **Responsibilities**: Product CRUD, inventory, categories.
  - **Pattern**: CQRS.
  - **Connectivity**: HTTP (internal/external), Kafka (Producer/Consumer).
  - **Database**: Own schema in PostgreSQL (products table).

### 2. CQRS Pattern

Each domain service (User, Product) will implement CQRS internally:

- **Commands (Write)**:
  - Located in `modules/[name]/repositories/commands`.
  - Focus on consistency and transactions.
  - Emit Kafka events (e.g., `UserCreated`, `ProductUpdated`) after successful DB commit.
- **Queries (Read)**:
  - Located in `modules/[name]/repositories/queries`.
  - Focus on performance.
  - Can return "Read Models" or DTOs directly.

### 3. Event-Driven Communication

- **Kafka** is the nervous system for _internal_ state changes.
- **User Service** emits `UserCreated`.
- **Product Service** might listen to `UserCreated` (e.g., to create a default "Wishlist" for the user).
- **Auth Service** is isolated from this complexity.

## High-Level Diagram

```mermaid
graph TD
    Client[Client App] -->|1. Login/Auth| Auth[Auth Service]
    Auth -->|2. Return JWT| Client

    Client -->|3. Get Profile (with Token)| User[User Service]
    Client -->|4. Buy Product (with Token)| Product[Product Service]

    subgraph "Async Event Bus"
    User -- Emits 'UserCreated' --> Kafka
    Product -- Listens 'UserCreated' --> Kafka
    end

    subgraph "Data Storage"
    User <-->|Drizzle| DB_User[(Postgres: Users)]
    Product <-->|Drizzle| DB_Product[(Postgres: Products)]
    end
```

## Tools & Verification Strategy

To ensure this architecture is implemented correctly without hallucination, the implementing agent **MUST** use the following tools and resources:

### 1. Architecture Validation

- **Tool**: `SearchCodebase`
  - **Usage**: Before implementing `Auth Service`, search for "gateway" or "proxy" patterns in existing code to see if any logic can be reused, but strictly enforce the "No Kafka" rule for Auth.
- **Tool**: `WebSearch`
  - **Usage**: If you are unsure about "API Gateway patterns with Hono", search for "Hono API Gateway example" to confirm best practices for proxying requests.

### 2. Diagram Verification

- **Tool**: `RunCommand`
  - **Usage**: After scaffolding, run `tree -L 2` to verify the directory structure matches the mental model of the diagram.
- **Comparison**: Visually compare the `tree` output with the "High-Level Diagram" to ensure `auth-service`, `user-service`, and `product-service` are at the root level.
