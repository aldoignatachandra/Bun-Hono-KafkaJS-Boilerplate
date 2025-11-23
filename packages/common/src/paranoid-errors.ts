/**
 * Paranoid-specific error types and handlers
 */

export class ParanoidError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'ParanoidError';
  }
}

export class SoftDeletedError extends ParanoidError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} is soft deleted and cannot be accessed`, 'SOFT_DELETED', 410);
  }
}

export class ResourceNotFoundError extends ParanoidError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 'RESOURCE_NOT_FOUND', 404);
  }
}

export class AccessDeniedError extends ParanoidError {
  constructor(resource: string, action: string) {
    super(`Access denied for ${action} on ${resource}`, 'ACCESS_DENIED', 403);
  }
}

export class InvalidParanoidOptionsError extends ParanoidError {
  constructor(options: Record<string, any>) {
    super(`Invalid paranoid options: ${JSON.stringify(options)}`, 'INVALID_PARANOID_OPTIONS', 400);
  }
}

/**
 * Error response formatter for paranoid operations
 */
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
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create standardized error response for paranoid operations
 */
export function createParanoidErrorResponse(
  error: ParanoidError,
  requestId?: string
): ParanoidErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Check if an entity is soft deleted and throw appropriate error
 */
export function checkSoftDeleted<T extends { deletedAt: Date | null; id: string }>(
  entity: T | null,
  resourceName: string,
  includeDeleted: boolean = false
): T {
  if (!entity) {
    throw new ResourceNotFoundError(resourceName, 'unknown');
  }

  if (entity.deletedAt && !includeDeleted) {
    throw new SoftDeletedError(resourceName, entity.id);
  }

  return entity;
}

/**
 * Validate paranoid query parameters
 */
export function validateParanoidQueryParams(params: {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  onlyActive?: boolean;
}): void {
  const { includeDeleted, onlyDeleted, onlyActive } = params;

  const activeOptions = [includeDeleted === true, onlyDeleted === true, onlyActive === true].filter(
    Boolean
  ).length;

  if (activeOptions > 1) {
    throw new InvalidParanoidOptionsError(params);
  }
}
