/**
 * Enhanced response types for paranoid operations
 */

export interface ParanoidResponse<T> {
  data: T;
  meta: {
    paranoid: {
      includeDeleted?: boolean;
      onlyDeleted?: boolean;
      onlyActive?: boolean;
    };
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      hasNext?: boolean;
      hasPrev?: boolean;
    };
    timestamp: string;
    requestId?: string;
  };
}

export interface ParanoidListResponse<T> extends ParanoidResponse<T[]> {
  meta: ParanoidResponse<T[]>['meta'] & {
    count: number;
    filters?: Record<string, any>;
  };
}

export interface ParanoidErrorResponse {
  error: {
    code: string;
    message: string;
    details?: {
      resource?: string;
      id?: string;
      paranoid?: {
        includeDeleted?: boolean;
        onlyDeleted?: boolean;
        onlyActive?: boolean;
      };
    };
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ParanoidOperationResult {
  success: boolean;
  operation: 'create' | 'update' | 'delete' | 'restore';
  resource: {
    type: string;
    id: string;
  };
  paranoid: {
    wasDeleted?: boolean;
    isDeleted?: boolean;
    restoredAt?: Date;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create a successful paranoid response
 */
export function createParanoidResponse<T>(
  data: T,
  paranoidOptions: {
    includeDeleted?: boolean;
    onlyDeleted?: boolean;
    onlyActive?: boolean;
  } = {},
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  },
  requestId?: string
): ParanoidResponse<T> {
  return {
    data,
    meta: {
      paranoid: paranoidOptions,
      pagination,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Create a successful paranoid list response
 */
export function createParanoidListResponse<T>(
  data: T[],
  count: number,
  paranoidOptions: {
    includeDeleted?: boolean;
    onlyDeleted?: boolean;
    onlyActive?: boolean;
  } = {},
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  },
  filters?: Record<string, any>,
  requestId?: string
): ParanoidListResponse<T> {
  return {
    data,
    meta: {
      paranoid: paranoidOptions,
      pagination,
      count,
      filters,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Create a paranoid operation result
 */
export function createParanoidOperationResult(
  success: boolean,
  operation: 'create' | 'update' | 'delete' | 'restore',
  resourceType: string,
  resourceId: string,
  paranoidState: {
    wasDeleted?: boolean;
    isDeleted?: boolean;
    restoredAt?: Date;
  } = {},
  requestId?: string
): ParanoidOperationResult {
  return {
    success,
    operation,
    resource: {
      type: resourceType,
      id: resourceId,
    },
    paranoid: paranoidState,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Response status codes for paranoid operations
 */
export enum ParanoidStatusCodes {
  SUCCESS = 'SUCCESS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  SOFT_DELETED = 'SOFT_DELETED',
  ALREADY_DELETED = 'ALREADY_DELETED',
  INVALID_PARANOID_OPTIONS = 'INVALID_PARANOID_OPTIONS',
  RESTORE_FAILED = 'RESTORE_FAILED',
}

/**
 * Response messages for paranoid operations
 */
export enum ParanoidMessages {
  SUCCESS = 'Operation completed successfully',
  RESOURCE_NOT_FOUND = 'Resource not found',
  ACCESS_DENIED = 'Access denied',
  SOFT_DELETED = 'Resource is soft deleted',
  ALREADY_DELETED = 'Resource is already deleted',
  INVALID_PARANOID_OPTIONS = 'Invalid paranoid query options',
  RESTORE_FAILED = 'Failed to restore resource',
  RESOURCE_RESTORED = 'Resource restored successfully',
  RESOURCE_SOFT_DELETED = 'Resource soft deleted successfully',
  RESOURCE_HARD_DELETED = 'Resource permanently deleted',
}
