import { Context } from 'hono';
import { StatusCode } from 'hono/utils/http-status';

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
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      details,
    },
  };
  return c.json(response, statusCode);
};
