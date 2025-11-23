import { NewProduct, NewUser } from '../schema/entities';

/**
 * Seed options interface
 */
export interface SeedOptions {
  env?: string;
  reset?: boolean;
  specific?: string[];
  dryRun?: boolean;
  batchSize?: number;
  skipValidation?: boolean;
}

/**
 * Seed data structure
 */
export interface SeedData {
  users?: NewUser[];
  products?: NewProduct[];
}

/**
 * Environment-specific seed configuration
 */
export interface EnvironmentSeedConfig {
  users: {
    admin: number;
    regular: number;
    moderators?: number;
  };
  products: {
    perUser: number;
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

/**
 * Seed execution result
 */
export interface SeedResult {
  success: boolean;
  environment: string;
  duration: number;
  seeded: {
    users: number;
    products: number;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Seed validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  entity?: string;
  index?: number;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  entity?: string;
  index?: number;
}
