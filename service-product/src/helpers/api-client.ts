import { createCircuitBreaker } from './circuit-breaker';

/**
 * Internal API Client
 *
 * Production-grade HTTP client for service-to-service communication.
 * Implements proper error handling, timeouts, and logging.
 *
 * @module api-client
 */

/**
 * Configuration for API client requests
 */
export interface ApiClientConfig {
  /** Base URL of the target service (e.g., 'http://localhost:3001') */
  baseUrl: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Optional authorization token for system auth */
  authToken?: string;
  /** Additional headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * API response wrapper matching the standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    details?: unknown;
  };
}

/**
 * Error thrown when API request fails
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
function createAbortController(ms: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return {
    controller,
    cancel: () => clearTimeout(timeoutId),
  };
}

type HttpMethod = 'GET' | 'POST';

type RequestPayload = {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
};

/**
 * Internal API Client
 *
 * Provides a type-safe way to make HTTP requests to other internal services.
 * Handles timeouts, errors, and response parsing.
 *
 * @example
 * ```typescript
 * const client = createApiClient({
 *   baseUrl: 'http://localhost:3001',
 *   timeout: 5000,
 *   authToken: 'Basic ' + btoa('user:pass')
 * });
 *
 * const response = await client.get<OldestUserResponse>('/api/internal/users/oldest?role=USER');
 * console.log(response.data);
 * ```
 */
export class InternalApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private breaker: ReturnType<typeof createCircuitBreaker<RequestPayload[], ApiResponse<unknown>>>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 5000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'service-product/internal-api-client',
      ...config.headers,
    };

    if (config.authToken) {
      this.defaultHeaders['Authorization'] = config.authToken;
    }

    // Circuit breaker prevents cascading failures when upstream services are unhealthy.
    this.breaker = createCircuitBreaker<[RequestPayload], ApiResponse<unknown>>(
      'internal-api-client',
      (payload: RequestPayload) => this.executeRequest(payload),
      { timeout: this.timeout }
    );
  }

  /**
   * Makes a GET request to the specified endpoint
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.breaker.fire({ method: 'GET', endpoint });
      return response as ApiResponse<T>;
    } catch (error) {
      this.handleBreakerError(error);
    }
  }

  /**
   * Makes a POST request to the specified endpoint
   */
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.breaker.fire({ method: 'POST', endpoint, body });
      return response as ApiResponse<T>;
    } catch (error) {
      this.handleBreakerError(error);
    }
  }

  private async executeRequest(payload: RequestPayload): Promise<ApiResponse<unknown>> {
    const url = `${this.baseUrl}${payload.endpoint}`;
    const { controller, cancel } = createAbortController(this.timeout);

    try {
      const response = await fetch(url, {
        method: payload.method,
        headers: this.defaultHeaders,
        body: payload.body ? JSON.stringify(payload.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorCode = `HTTP_${response.status}`;
        let errorDetails: unknown;

        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorCode = errorData.error.code || errorCode;
            errorDetails = errorData.error.details;
            errorMessage = errorData.message || errorMessage;
          }
        } catch {
          // Response is not JSON, use status text
        }

        throw new ApiClientError(errorMessage, response.status, errorCode, errorDetails);
      }

      return (await response.json()) as ApiResponse<unknown>;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(`Request timeout after ${this.timeout}ms`, 0, 'TIMEOUT');
      }

      const message = error instanceof Error ? error.message : 'Unknown network error';
      throw new ApiClientError(
        `Failed to connect to ${this.baseUrl}: ${message}`,
        0,
        'NETWORK_ERROR',
        message
      );
    } finally {
      cancel();
    }
  }

  private handleBreakerError(error: unknown): never {
    if (error instanceof ApiClientError) {
      throw error;
    }

    const code = (error as { code?: string }).code;
    if (code === 'EOPENBREAKER') {
      throw new ApiClientError('Upstream service temporarily unavailable', 503, 'CIRCUIT_OPEN');
    }
    if (code === 'ETIMEDOUT') {
      throw new ApiClientError(`Request timeout after ${this.timeout}ms`, 0, 'TIMEOUT');
    }

    const message = error instanceof Error ? error.message : 'Unknown circuit breaker error';
    throw new ApiClientError(message, 0, 'CIRCUIT_ERROR', error);
  }
}

/**
 * Factory function to create an API client instance
 */
export function createApiClient(config: ApiClientConfig): InternalApiClient {
  return new InternalApiClient(config);
}

/**
 * Default client configurations for known services
 */
export const ServiceUrls = {
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3101',
  PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3102',
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'http://localhost:3100',
} as const;
