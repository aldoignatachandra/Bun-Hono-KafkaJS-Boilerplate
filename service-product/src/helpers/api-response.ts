import { Context } from 'hono';
import { StatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
  error?: {
    code: string;
    details?: any;
  };
};

// Helper to format error details
const formatErrorDetails = (details: any) => {
  // 1. Zod Error
  if (details instanceof ZodError) {
    return details.errors.map(issue => ({
      code: issue.code,
      message: issue.message,
      path: issue.path,
    }));
  }

  // 2. Array of Zod Issues (sometimes passed directly)
  if (Array.isArray(details) && details.length > 0 && (details[0].code || details[0].message)) {
    return details;
  }

  // 3. Postgres/Database Error (duck typing)
  if (details && typeof details === 'object' && details.code && details.severity === 'ERROR') {
    // Postgres Error Codes
    if (details.code === '23505') {
      // Unique violation
      // Try to extract column from constraint name or detail
      // Detail format: Key (sku)=(GW6-BLK-SM) already exists.
      const match = details.detail?.match(/Key \((.*?)\)=\((.*?)\) already exists/);
      const field = match ? match[1] : 'unknown';
      const value = match ? match[2] : undefined;

      return [
        {
          code: 'unique_violation',
          message: `${field} already exists`,
          path: [field],
          received: value,
        },
      ];
    }

    if (details.code === '23503') {
      // Foreign key violation
      return [
        {
          code: 'foreign_key_violation',
          message: 'Referenced record does not exist',
          details: details.detail,
        },
      ];
    }

    return [
      {
        code: 'database_error',
        message: details.message || 'Database error occurred',
        details: details.detail,
      },
    ];
  }

  // 4. Standard Error
  if (details instanceof Error) {
    return [
      {
        code: 'internal_error',
        message: details.message,
        stack: process.env.NODE_ENV === 'dev' ? details.stack : undefined,
      },
    ];
  }

  // 5. String or other
  if (typeof details === 'string') {
    return [
      {
        code: 'error',
        message: details,
      },
    ];
  }

  return details;
};

/**
 * Standard Success Response
 */
export const successResponse = <T>(
  c: Context,
  data: T,
  message: string = 'Success',
  statusCode: StatusCode = 200,
  meta?: any
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return c.json(response, statusCode);
};

/**
 * Standard Error Response
 */
export const errorResponse = (
  c: Context,
  message: string,
  code: string = 'INTERNAL_SERVER_ERROR',
  statusCode: StatusCode = 500,
  details?: any
) => {
  const formattedDetails = formatErrorDetails(details);

  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      details: formattedDetails,
    },
  };
  return c.json(response, statusCode);
};
