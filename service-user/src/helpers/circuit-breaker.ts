import CircuitBreaker from 'opossum';
import logger from './logger';

export type CircuitBreakerConfig = {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
};

const defaultConfig: CircuitBreakerConfig = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 15000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
};

/**
 * Creates a circuit breaker with consistent defaults.
 * Keep this in one place to avoid configuration drift.
 */
export const createCircuitBreaker = <Args extends unknown[], Result>(
  name: string,
  action: (...args: Args) => Promise<Result>,
  overrides: Partial<CircuitBreakerConfig> = {}
) => {
  const breaker = new CircuitBreaker(action, { ...defaultConfig, ...overrides });

  breaker.on('open', () => logger.warn({ name }, 'Circuit breaker opened'));
  breaker.on('halfOpen', () => logger.warn({ name }, 'Circuit breaker half-open'));
  breaker.on('close', () => logger.info({ name }, 'Circuit breaker closed'));
  breaker.on('reject', () => logger.warn({ name }, 'Circuit breaker rejected request'));

  return breaker;
};
