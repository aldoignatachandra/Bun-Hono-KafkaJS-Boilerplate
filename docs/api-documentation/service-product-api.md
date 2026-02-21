# Product Service API Documentation

> **Service Name:** Product Service
>
> **Version:** 1.0.0
>
> **Base URL:** `http://localhost:3102`
>
> **Port:** 3102

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Error Codes](#error-codes)
- [Data Models](#data-models)
- [Marketplace Model](#marketplace-model)
- [Examples](#examples)

---

## Overview

The Product Service is responsible for:

- **Product Management**: CRUD operations for products
- **Marketplace Model**: Multi-owner product catalog
- **Product Variants**: Size, color, and attribute combinations
- **Product Attributes**: Configurable product attributes
- **Search & Filter**: Advanced product search capabilities

### Key Features

| Feature                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| **Marketplace Model**  | Multiple owners can have products with the same name |
| **Soft Delete**        | Products can be soft-deleted and restored            |
| **Owner-Based Access** | Users can only access their own products             |
| **Product Variants**   | Support for SKUs with different attributes           |
| **Advanced Search**    | Search by name, price range, and filters             |
| **Stock Management**   | Track product inventory                              |

---

## Authentication

### 1. JWT Authentication

Required for all product endpoints.

**Header Format:**

```
Authorization: Bearer <jwt-token>
```

**Token Structure:**

```typescript
{
  sub: string; // User ID
  email: string; // User email
  role: "ADMIN" | "USER";
  jti: string; // Session ID
  iat: number; // Issued at
  exp: number; // Expires at
}
```

### 2. System Authentication

Required for admin health check endpoint.

**Header Format:**

```
Authorization: Basic <base64(SYSTEM_USER:SYSTEM_PASS)>
```

**Environment Variables:**

```bash
SYSTEM_USER=admin
SYSTEM_PASS=admin123
```

### 3. Access Control

| Role    | Access                                      |
| ------- | ------------------------------------------- |
| `USER`  | Can access own products only                |
| `ADMIN` | Can access all products regardless of owner |

---

## Endpoints

### 1. Health Check

**Public endpoint** to check service health.

| Attribute         | Value     |
| ----------------- | --------- |
| **Method**        | `GET`     |
| **Path**          | `/health` |
| **Auth Required** | ❌ No     |

#### Request

```http
GET /health HTTP/1.1
Host: localhost:3102
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "service": "product-service",
    "environment": "development",
    "database": "connected",
    "timestamp": "2026-02-21T10:00:00.000Z"
  }
}
```

---

### 2. Admin Health Check

**Protected endpoint** for detailed health monitoring.

| Attribute         | Value           |
| ----------------- | --------------- |
| **Method**        | `GET`           |
| **Path**          | `/admin/health` |
| **Auth Required** | ✅ System Auth  |

#### Request

```http
GET /admin/health HTTP/1.1
Host: localhost:3102
Authorization: Basic YWRtaW46YWRtaW4xMjM=
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Admin health check passed",
  "data": {
    "service": "product-service",
    "mode": "admin",
    "config": {
      "db": "connected",
      "kafka": "connected"
    },
    "timestamp": "2026-02-21T10:00:00.000Z"
  }
}
```

---

### 3. Create Product

Creates a new product owned by the authenticated user.

| Attribute         | Value             |
| ----------------- | ----------------- |
| **Method**        | `POST`            |
| **Path**          | `/products`       |
| **Auth Required** | ✅ JWT (Any Role) |

#### Request

```http
POST /products HTTP/1.1
Host: localhost:3102
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Premium T-Shirt",
  "price": 2999
}
```

**Fields:**

| Field   | Type   | Required | Description                       |
| ------- | ------ | -------- | --------------------------------- |
| `name`  | string | ✅ Yes   | Product name (1-255 characters)   |
| `price` | number | ✅ Yes   | Price in cents (positive integer) |

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Premium T-Shirt",
    "price": 2999,
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "stock": 0,
    "hasVariant": false,
    "createdAt": "2026-02-21T10:00:00.000Z",
    "updatedAt": "2026-02-21T10:00:00.000Z"
  }
}
```

#### Error Responses

| Code  | Error Code              | Description              |
| ----- | ----------------------- | ------------------------ |
| `400` | `PRODUCT_CREATE_FAILED` | Validation error         |
| `401` | `UNAUTHORIZED`          | Invalid or missing token |

#### cURL Example

```bash
curl -X POST http://localhost:3102/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium T-Shirt",
    "price": 2999
  }'
```

---

### 4. Get Products

Retrieves products with filtering and pagination.

| Attribute         | Value             |
| ----------------- | ----------------- |
| **Method**        | `GET`             |
| **Path**          | `/products`       |
| **Auth Required** | ✅ JWT (Any Role) |

#### Request

```http
GET /products?page=1&limit=10&search=shirt&minPrice=1000&maxPrice=5000&includeDeleted=false HTTP/1.1
Host: localhost:3102
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

| Parameter        | Type    | Default | Description                     |
| ---------------- | ------- | ------- | ------------------------------- |
| `page`           | number  | `1`     | Page number                     |
| `limit`          | number  | `10`    | Items per page                  |
| `search`         | string  | `null`  | Search by product name          |
| `minPrice`       | number  | `null`  | Minimum price filter (cents)    |
| `maxPrice`       | number  | `null`  | Maximum price filter (cents)    |
| `includeDeleted` | boolean | `false` | Include soft-deleted products   |
| `onlyDeleted`    | boolean | `false` | Only show soft-deleted products |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Premium T-Shirt",
      "price": 2999,
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "stock": 100,
      "hasVariant": true,
      "createdAt": "2026-02-21T10:00:00.000Z",
      "updatedAt": "2026-02-21T10:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "count": 1,
    "includeDeleted": false,
    "onlyDeleted": false,
    "search": "shirt",
    "priceRange": {
      "min": 1000,
      "max": 5000
    }
  }
}
```

#### Error Responses

| Code  | Error Code             | Description              |
| ----- | ---------------------- | ------------------------ |
| `500` | `PRODUCT_FETCH_FAILED` | Failed to fetch products |

---

### 5. Get Product by ID

Retrieves a specific product.

> **Note:** Users can only fetch their own products. ADMINs can fetch any product.

| Attribute         | Value             |
| ----------------- | ----------------- |
| **Method**        | `GET`             |
| **Path**          | `/products/:id`   |
| **Auth Required** | ✅ JWT (Any Role) |

#### Request

```http
GET /products/770e8400-e29b-41d4-a716-446655440000?includeDeleted=false HTTP/1.1
Host: localhost:3102
Authorization: Bearer <jwt-token>
```

**Path Parameters:**

| Parameter | Type          | Description |
| --------- | ------------- | ----------- |
| `id`      | string (UUID) | Product ID  |

**Query Parameters:**

| Parameter        | Type    | Default | Description                   |
| ---------------- | ------- | ------- | ----------------------------- |
| `includeDeleted` | boolean | `false` | Include soft-deleted products |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Premium T-Shirt",
    "price": 2999,
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "stock": 100,
    "hasVariant": true,
    "createdAt": "2026-02-21T10:00:00.000Z",
    "updatedAt": "2026-02-21T10:00:00.000Z",
    "deletedAt": null
  }
}
```

#### Error Responses

| Code  | Error Code             | Description                          |
| ----- | ---------------------- | ------------------------------------ |
| `403` | `ACCESS_DENIED`        | User doesn't own product (not ADMIN) |
| `404` | `PRODUCT_NOT_FOUND`    | Product not found                    |
| `500` | `PRODUCT_FETCH_FAILED` | Failed to fetch product              |

---

### 6. Update Product

Updates an existing product.

> **Note:** Only the product owner can update. ADMINs can update any product.

| Attribute         | Value             |
| ----------------- | ----------------- |
| **Method**        | `PATCH`           |
| **Path**          | `/products/:id`   |
| **Auth Required** | ✅ JWT (Any Role) |

#### Request

```http
PATCH /products/770e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: localhost:3102
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Premium T-Shirt V2",
  "price": 3499
}
```

**Fields:**

| Field   | Type   | Required | Description                       |
| ------- | ------ | -------- | --------------------------------- |
| `name`  | string | ❌ No    | Product name (1-255 characters)   |
| `price` | number | ❌ No    | Price in cents (positive integer) |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Premium T-Shirt V2",
    "price": 3499,
    "ownerId": "550e8400-e29b-41d4-a716-446655440000",
    "stock": 100,
    "hasVariant": true,
    "createdAt": "2026-02-21T10:00:00.000Z",
    "updatedAt": "2026-02-21T10:05:00.000Z"
  }
}
```

#### Error Responses

| Code  | Error Code              | Description                          |
| ----- | ----------------------- | ------------------------------------ |
| `400` | `PRODUCT_UPDATE_FAILED` | Validation error                     |
| `401` | `UNAUTHORIZED`          | Invalid or missing token             |
| `403` | `ACCESS_DENIED`         | User doesn't own product (not ADMIN) |

#### cURL Example

```bash
curl -X PATCH http://localhost:3102/products/770e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium T-Shirt V2",
    "price": 3499
  }'
```

---

### 7. Delete Product

Deletes a product (soft delete by default).

> **Note:** Only the product owner can delete. ADMINs can delete any product.

| Attribute         | Value             |
| ----------------- | ----------------- |
| **Method**        | `DELETE`          |
| **Path**          | `/products/:id`   |
| **Auth Required** | ✅ JWT (Any Role) |

#### Request

```http
DELETE /products/770e8400-e29b-41d4-a716-446655440000?force=false HTTP/1.1
Host: localhost:3102
Authorization: Bearer <jwt-token>
```

**Path Parameters:**

| Parameter | Type          | Description |
| --------- | ------------- | ----------- |
| `id`      | string (UUID) | Product ID  |

**Query Parameters:**

| Parameter | Type    | Default | Description                      |
| --------- | ------- | ------- | -------------------------------- |
| `force`   | boolean | `false` | Permanent deletion (hard delete) |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Product soft deleted",
  "data": {
    "productId": "770e8400-e29b-41d4-a716-446655440000",
    "force": false
  }
}
```

#### Error Responses

| Code  | Error Code              | Description                          |
| ----- | ----------------------- | ------------------------------------ |
| `400` | `PRODUCT_DELETE_FAILED` | Deletion failed                      |
| `401` | `UNAUTHORIZED`          | Invalid or missing token             |
| `403` | `ACCESS_DENIED`         | User doesn't own product (not ADMIN) |
| `404` | `PRODUCT_NOT_FOUND`     | Product not found                    |

---

### 8. Restore Product

Restores a soft-deleted product.

> **Note:** Only the product owner can restore. ADMINs can restore any product.

| Attribute         | Value                   |
| ----------------- | ----------------------- |
| **Method**        | `POST`                  |
| **Path**          | `/products/:id/restore` |
| **Auth Required** | ✅ JWT (Any Role)       |

#### Request

```http
POST /products/770e8400-e29b-41d4-a716-446655440000/restore HTTP/1.1
Host: localhost:3102
Authorization: Bearer <jwt-token>
```

**Path Parameters:**

| Parameter | Type          | Description |
| --------- | ------------- | ----------- |
| `id`      | string (UUID) | Product ID  |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Product restored successfully",
  "data": {
    "product": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Premium T-Shirt",
      "price": 2999,
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "stock": 100,
      "hasVariant": true,
      "createdAt": "2026-02-21T10:00:00.000Z",
      "updatedAt": "2026-02-21T10:10:00.000Z"
    }
  }
}
```

#### Error Responses

| Code  | Error Code               | Description        |
| ----- | ------------------------ | ------------------ |
| `404` | `PRODUCT_NOT_FOUND`      | Product not found  |
| `500` | `PRODUCT_RESTORE_FAILED` | Restoration failed |

---

### 9. Search Products

Alternative endpoint for product search with dedicated search query.

| Attribute         | Value              |
| ----------------- | ------------------ |
| **Method**        | `GET`              |
| **Path**          | `/products/search` |
| **Auth Required** | ✅ JWT (Any Role)  |

#### Request

```http
GET /products/search?q=t-shirt&includeDeleted=false HTTP/1.1
Host: localhost:3102
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

| Parameter        | Type    | Required | Description                     |
| ---------------- | ------- | -------- | ------------------------------- |
| `q`              | string  | ✅ Yes   | Search query                    |
| `includeDeleted` | boolean | `false`  | Include soft-deleted products   |
| `onlyDeleted`    | boolean | `false`  | Only show soft-deleted products |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Products searched successfully",
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Premium T-Shirt",
      "price": 2999,
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "stock": 100,
      "hasVariant": true,
      "createdAt": "2026-02-21T10:00:00.000Z",
      "updatedAt": "2026-02-21T10:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "query": "t-shirt",
    "includeDeleted": false,
    "onlyDeleted": false,
    "count": 1
  }
}
```

#### Error Responses

| Code  | Error Code              | Description                    |
| ----- | ----------------------- | ------------------------------ |
| `400` | `MISSING_SEARCH_QUERY`  | Search query (`q`) is required |
| `500` | `PRODUCT_SEARCH_FAILED` | Search failed                  |

---

## Error Codes

| Error Code               | HTTP Status | Description                        |
| ------------------------ | ----------- | ---------------------------------- |
| `UNAUTHORIZED`           | 401         | Authentication required            |
| `ACCESS_DENIED`          | 403         | User cannot access resource        |
| `PRODUCT_NOT_FOUND`      | 404         | Product does not exist             |
| `PRODUCT_CREATE_FAILED`  | 400         | Product creation validation failed |
| `PRODUCT_UPDATE_FAILED`  | 400         | Product update validation failed   |
| `PRODUCT_DELETE_FAILED`  | 400         | Product deletion failed            |
| `PRODUCT_FETCH_FAILED`   | 500         | Failed to fetch products           |
| `PRODUCT_SEARCH_FAILED`  | 500         | Product search error               |
| `PRODUCT_RESTORE_FAILED` | 500         | Product restoration failed         |
| `MISSING_SEARCH_QUERY`   | 400         | Search query parameter required    |
| `SERVICE_UNHEALTHY`      | 503         | Service health check failed        |

---

## Data Models

### Product

```typescript
interface Product {
  id: string; // UUID
  name: string; // 1-255 characters
  price: number; // Price in cents (positive integer)
  ownerId: string; // Owner user ID (UUID)
  stock: number; // Current stock quantity
  hasVariant: boolean; // Has product variants
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete timestamp
}
```

### ProductVariant

```typescript
interface ProductVariant {
  id: string; // UUID
  productId: string; // Parent product ID
  sku: string; // Stock keeping unit
  price: number; // Variant price in cents
  stockQuantity: number; // Variant stock quantity
  isActive: boolean; // Variant availability
  attributeValues: {
    // Attribute combinations
    [key: string]: string; // e.g., { Color: "Red", Size: "L" }
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### ProductAttribute

```typescript
interface ProductAttribute {
  id: string; // UUID
  productId: string; // Parent product ID
  name: string; // Attribute name (e.g., "Color", "Size")
  values: string[]; // Possible values
  displayOrder: number; // Display sort order
  createdAt: Date;
  updatedAt: Date;
}
```

### CreateProductRequest

```typescript
interface CreateProductRequest {
  name: string; // Required, 1-255 characters
  price: number; // Required, positive integer (cents)
}
```

### UpdateProductRequest

```typescript
interface UpdateProductRequest {
  name?: string; // Optional, 1-255 characters
  price?: number; // Optional, positive integer (cents)
}
```

---

## Marketplace Model

### Product Ownership

Products follow a **marketplace model** where:

1. **Multiple owners** can have products with the **same name**
2. Products are unique by **(name, ownerId)** combination
3. Users can only access their **own products**
4. **ADMIN** users can access **all products**

### Example

```
User A (ownerId: 111...)
├── "iPhone Case" (id: aaa...)
└── "T-Shirt"    (id: bbb...)

User B (ownerId: 222...)
├── "iPhone Case" (id: ccc...)  ✅ Different product, same name
└── "Laptop Bag"  (id: ddd...)

User C (ADMIN)
└── Can access ALL products from all users
```

### Access Control Matrix

| Operation | Owner  | ADMIN  | Other User |
| --------- | ------ | ------ | ---------- |
| Create    | ✅     | ✅     | ✅         |
| Read      | ✅ Own | ✅ All | ✅ Own     |
| Update    | ✅ Own | ✅ All | ❌         |
| Delete    | ✅ Own | ✅ All | ❌         |
| Restore   | ✅ Own | ✅ All | ❌         |

---

## TypeScript Types

```typescript
// src/modules/product/domain/types.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  ownerId: string;
  stock: number;
  hasVariant: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
  ownerId: string;
  stock: number;
  hasVariant: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateProductRequest {
  name: string;
  price: number;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
}

export interface ProductQueryOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  page?: number;
  limit?: number;
}
```

---

## Usage Examples

### Create Product

```typescript
const response = await fetch("http://localhost:3102/products", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Premium T-Shirt",
    price: 2999, // $29.99
  }),
});

const { data } = await response.json();
console.log("Created product:", data.id);
```

### Search Products

```typescript
const response = await fetch(
  "http://localhost:3102/products/search?q=t-shirt&page=1&limit=20",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const { data, meta } = await response.json();
console.log(`Found ${meta.count} products`);
```

### Get Products with Filters

```typescript
const params = new URLSearchParams({
  minPrice: "1000",
  maxPrice: "5000",
  page: "1",
  limit: "10",
});

const response = await fetch(`http://localhost:3102/products?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Update Product

```typescript
const response = await fetch(
  "http://localhost:3102/products/770e8400-e29b-41d4-a716-446655440000",
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Premium T-Shirt V2",
      price: 3499,
    }),
  },
);
```

---

**Last Updated:** 2026-02-21
**Documentation Version:** 1.0.0
