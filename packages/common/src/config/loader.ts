import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';

// Configuration schema validation
const ConfigSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
  }),
  database: z.object({
    url: z.string(),
    pool: z.object({
      min: z.number(),
      max: z.number(),
      idleTimeoutMs: z.number(),
    }),
    ssl: z.boolean().optional(),
    maxConnections: z.number().optional(),
    connectionTimeout: z.number().optional(),
    idleTimeout: z.number().optional(),
  }),
  auth: z.object({
    jwt: z.object({
      secret: z.string(),
      expiresIn: z.string(),
    }),
  }),
  services: z.object({
    userService: z.object({
      port: z.number(),
    }),
    productService: z.object({
      port: z.number(),
    }),
  }),
  kafka: z.object({
    clientId: z.string(),
    brokers: z.array(z.string()),
    ssl: z.boolean(),
    sasl: z.object({
      mechanism: z.string(),
      username: z.string(),
      password: z.string(),
    }),
    producer: z.object({
      batchSize: z.number(),
      lingerMs: z.number(),
      compressionType: z.string(),
      maxInFlightRequests: z.number(),
      enableIdempotence: z.boolean(),
    }),
    consumer: z.object({
      sessionTimeoutMs: z.number(),
      heartbeatIntervalMs: z.number(),
      maxPollRecords: z.number(),
      autoOffsetReset: z.enum(['earliest', 'latest']),
      enableAutoCommit: z.boolean(),
    }),
    topics: z.record(
      z.object({
        partitions: z.number(),
        replicationFactor: z.number(),
        config: z.record(z.string()),
      })
    ),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    pretty: z.boolean(),
  }),
  metrics: z.object({
    enabled: z.boolean(),
    collectDefaultMetrics: z.boolean(),
    prefix: z.string(),
    buckets: z.array(z.number()),
  }),
  security: z.object({
    encryptionEnabled: z.boolean(),
    keyRotationInterval: z.number(),
    auditLogging: z.boolean(),
  }),
  features: z.object({
    hotReload: z.boolean(),
    autoMigrate: z.boolean(),
    debugMode: z.boolean(),
    mockExternalServices: z.boolean(),
  }),
  drizzle: z
    .object({
      logger: z.boolean().optional(),
      schema: z.string().optional(),
      migrations: z
        .object({
          dir: z.string().optional(),
          prefix: z.string().optional(),
          suffix: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

type Config = z.infer<typeof ConfigSchema>;

class ConfigLoader {
  private static instance: ConfigLoader;
  private config: Config;
  private env: string;

  private constructor() {
    // Load .env file first to ensure it takes precedence
    this.loadEnvFile();
    this.env = process.env.NODE_ENV || 'dev';
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  private loadConfig(): Config {
    // Load base configuration
    const baseConfig = this.loadConfigFile('base.json');

    // Load environment-specific configuration
    const envConfig = this.loadConfigFile(`${this.env}.json`);

    // Merge configurations (env overrides base)
    const mergedConfig = this.mergeConfigs(baseConfig, envConfig);

    // Override with environment variables (from .env and process.env)
    const configWithEnvVars = this.applyEnvironmentVariables(mergedConfig);

    // Validate and return configuration
    return ConfigSchema.parse(configWithEnvVars);
  }

  private loadConfigFile(filename: string): any {
    try {
      // Try to find config directory by going up from current directory
      let currentDir = process.cwd();
      let configPath = '';

      // Check if we're in an app directory and need to go up to find config
      if (currentDir.includes('/apps/')) {
        // Go up to the root directory
        const rootDir = currentDir.substring(0, currentDir.indexOf('/apps/'));
        configPath = resolve(rootDir, 'config', filename);
      } else {
        // Assume we're already at the right level
        configPath = resolve(currentDir, 'config', filename);
      }

      const fileContent = readFileSync(configPath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.warn(`Failed to load config file: ${filename}`, error);
      return {};
    }
  }

  private loadEnvFile(): void {
    try {
      // Try to find .env file by going up from current directory
      let currentDir = process.cwd();
      let envPath = '';

      // Check if we're in an app directory and need to go up to find .env
      if (currentDir.includes('/apps/')) {
        // Go up to the root directory
        const rootDir = currentDir.substring(0, currentDir.indexOf('/apps/'));
        envPath = resolve(rootDir, '.env');
      } else {
        // Assume we're already at the right level
        envPath = resolve(currentDir, '.env');
      }

      if (existsSync(envPath)) {
        // Load and parse .env file
        const envContent = readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');

        for (const line of envLines) {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=');
              // Remove quotes from values if present
              const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
              process.env[key.trim()] = cleanValue.trim();
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load .env file:', error);
    }
  }

  private mergeConfigs(base: any, env: any): any {
    return {
      ...base,
      ...env,
      database: {
        ...base.database,
        ...env.database,
        pool: {
          ...base.database?.pool,
          ...env.database?.pool,
        },
        ssl: env.database?.ssl ?? base.database?.ssl,
        maxConnections: env.database?.maxConnections ?? base.database?.maxConnections,
        connectionTimeout: env.database?.connectionTimeout ?? base.database?.connectionTimeout,
        idleTimeout: env.database?.idleTimeout ?? base.database?.idleTimeout,
      },
      auth: {
        ...base.auth,
        ...env.auth,
        jwt: {
          ...base.auth?.jwt,
          ...env.auth?.jwt,
        },
      },
      services: {
        ...base.services,
        ...env.services,
        userService: {
          ...base.services?.userService,
          ...env.services?.userService,
        },
        productService: {
          ...base.services?.productService,
          ...env.services?.productService,
        },
      },
      kafka: {
        ...base.kafka,
        ...env.kafka,
        producer: {
          ...base.kafka?.producer,
          ...env.kafka?.producer,
        },
        consumer: {
          ...base.kafka?.consumer,
          ...env.kafka?.consumer,
        },
        topics: {
          ...base.kafka?.topics,
          ...env.kafka?.topics,
        },
      },
      logging: {
        ...base.logging,
        ...env.logging,
      },
      metrics: {
        ...base.metrics,
        ...env.metrics,
        collectDefaultMetrics:
          process.env.METRICS_COLLECT_DEFAULT === 'true'
            ? true
            : base.metrics.collectDefaultMetrics,
        prefix: process.env.METRICS_PREFIX || base.metrics.prefix,
        buckets: process.env.METRICS_BUCKETS
          ? process.env.METRICS_BUCKETS.split(',').map(b => parseFloat(b.trim()))
          : base.metrics.buckets,
      },
      features: {
        ...base.features,
        ...env.features,
        hotReload: process.env.HOT_RELOAD === 'true' ? true : base.features.hotReload,
        autoMigrate: process.env.AUTO_MIGRATE === 'true' ? true : base.features.autoMigrate,
        debugMode: process.env.DEBUG_MODE === 'true' ? true : base.features.debugMode,
        mockExternalServices:
          process.env.MOCK_EXTERNAL_SERVICES === 'true' ? true : base.features.mockExternalServices,
      },
      drizzle: {
        ...base.drizzle,
        ...env.drizzle,
        logger: process.env.DRIZZLE_LOGGER === 'true' ? true : (base.drizzle?.logger ?? false),
        schema: process.env.DRIZZLE_SCHEMA || base.drizzle?.schema,
        migrations: {
          ...base.drizzle?.migrations,
          ...env.drizzle?.migrations,
          dir: process.env.DRIZZLE_MIGRATIONS_DIR || base.drizzle?.migrations?.dir,
          prefix: process.env.DRIZZLE_MIGRATIONS_PREFIX || base.drizzle?.migrations?.prefix,
          suffix: process.env.DRIZZLE_MIGRATIONS_SUFFIX || base.drizzle?.migrations?.suffix,
        },
      },
      security: {
        ...base.security,
        ...env.security,
        encryptionEnabled:
          process.env.ENCRYPTION_ENABLED === 'true' ? true : base.security.encryptionEnabled,
        keyRotationInterval: parseInt(
          process.env.KEY_ROTATION_INTERVAL || String(base.security.keyRotationInterval)
        ),
        auditLogging: process.env.AUDIT_LOGGING === 'true' ? true : base.security.auditLogging,
      },
    };
  }

  private applyEnvironmentVariables(config: any): any {
    return {
      ...config,
      database: {
        ...config.database,
        url: process.env.DB_URL || config.database.url,
        pool: {
          ...config.database.pool,
          min: parseInt(process.env.DB_POOL_MIN || String(config.database.pool.min)),
          max: parseInt(process.env.DB_POOL_MAX || String(config.database.pool.max)),
          idleTimeoutMs: parseInt(
            process.env.DB_IDLE_TIMEOUT_MS || String(config.database.pool.idleTimeoutMs)
          ),
        },
        ssl: process.env.DB_SSL === 'true' ? true : config.database.ssl,
        maxConnections: parseInt(
          process.env.DB_MAX_CONNECTIONS || String(config.database.maxConnections || 20)
        ),
        connectionTimeout: parseInt(
          process.env.DB_CONNECTION_TIMEOUT || String(config.database.connectionTimeout || 10)
        ),
        idleTimeout: parseInt(
          process.env.DB_IDLE_TIMEOUT || String(config.database.idleTimeout || 20)
        ),
      },
      auth: {
        ...config.auth,
        jwt: {
          ...config.auth.jwt,
          secret: process.env.JWT_SECRET || config.auth.jwt.secret,
          expiresIn: process.env.JWT_EXPIRES || config.auth.jwt.expiresIn,
        },
      },
      services: {
        ...config.services,
        userService: {
          ...config.services.userService,
          port: parseInt(process.env.USER_SERVICE_PORT || String(config.services.userService.port)),
        },
        productService: {
          ...config.services.productService,
          port: parseInt(
            process.env.PRODUCT_SERVICE_PORT || String(config.services.productService.port)
          ),
        },
      },
      kafka: {
        ...config.kafka,
        clientId: process.env.KAFKA_CLIENT_ID || config.kafka.clientId,
        brokers: process.env.KAFKA_BROKERS
          ? process.env.KAFKA_BROKERS.split(',').map(b => b.trim())
          : config.kafka.brokers,
        ssl: process.env.KAFKA_SSL === 'true' ? true : config.kafka.ssl,
        sasl: {
          ...config.kafka.sasl,
          mechanism: process.env.KAFKA_SASL_MECHANISM || config.kafka.sasl.mechanism,
          username: process.env.KAFKA_USERNAME || config.kafka.sasl.username,
          password: process.env.KAFKA_PASSWORD || config.kafka.sasl.password,
        },
        producer: {
          ...config.kafka.producer,
          batchSize: parseInt(
            process.env.KAFKA_PRODUCER_BATCH_SIZE || String(config.kafka.producer.batchSize)
          ),
          lingerMs: parseInt(
            process.env.KAFKA_PRODUCER_LINGER_MS || String(config.kafka.producer.lingerMs)
          ),
          compressionType:
            process.env.KAFKA_PRODUCER_COMPRESSION_TYPE || config.kafka.producer.compressionType,
          maxInFlightRequests: parseInt(
            process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS ||
              String(config.kafka.producer.maxInFlightRequests)
          ),
          enableIdempotence:
            process.env.KAFKA_PRODUCER_ENABLE_IDEMPOTENCE === 'true'
              ? true
              : config.kafka.producer.enableIdempotence,
        },
        consumer: {
          ...config.kafka.consumer,
          sessionTimeoutMs: parseInt(
            process.env.KAFKA_CONSUMER_SESSION_TIMEOUT_MS ||
              String(config.kafka.consumer.sessionTimeoutMs)
          ),
          heartbeatIntervalMs: parseInt(
            process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL_MS ||
              String(config.kafka.consumer.heartbeatIntervalMs)
          ),
          maxPollRecords: parseInt(
            process.env.KAFKA_CONSUMER_MAX_POLL_RECORDS ||
              String(config.kafka.consumer.maxPollRecords)
          ),
          autoOffsetReset:
            (process.env.KAFKA_CONSUMER_AUTO_OFFSET_RESET as any) ||
            config.kafka.consumer.autoOffsetReset,
          enableAutoCommit:
            process.env.KAFKA_CONSUMER_ENABLE_AUTO_COMMIT === 'true'
              ? true
              : config.kafka.consumer.enableAutoCommit,
        },
      },
      logging: {
        ...config.logging,
        level: (process.env.LOG_LEVEL as any) || config.logging.level,
        pretty: process.env.LOG_PRETTY === 'true' ? true : config.logging.pretty,
      },
      metrics: {
        ...config.metrics,
        enabled: process.env.METRICS_ENABLED === 'true' ? true : config.metrics.enabled,
      },
      features: {
        ...config.features,
        hotReload: process.env.HOT_RELOAD === 'true' ? true : config.features.hotReload,
        autoMigrate: process.env.AUTO_MIGRATE === 'true' ? true : config.features.autoMigrate,
        debugMode: process.env.DEBUG_MODE === 'true' ? true : config.features.debugMode,
        mockExternalServices:
          process.env.MOCK_EXTERNAL_SERVICES === 'true'
            ? true
            : config.features.mockExternalServices,
      },
      security: {
        ...config.security,
        encryptionEnabled:
          process.env.ENCRYPTION_ENABLED === 'true' ? true : config.security.encryptionEnabled,
        keyRotationInterval: parseInt(
          process.env.KEY_ROTATION_INTERVAL || String(config.security.keyRotationInterval)
        ),
        auditLogging: process.env.AUDIT_LOGGING === 'true' ? true : config.security.auditLogging,
      },
      drizzle: {
        ...config.drizzle,
        logger: process.env.DRIZZLE_LOGGER === 'true' ? true : (config.drizzle?.logger ?? false),
        schema: process.env.DRIZZLE_SCHEMA || config.drizzle?.schema,
        migrations: {
          ...config.drizzle?.migrations,
          dir: process.env.DRIZZLE_MIGRATIONS_DIR || config.drizzle?.migrations?.dir,
          prefix: process.env.DRIZZLE_MIGRATIONS_PREFIX || config.drizzle?.migrations?.prefix,
          suffix: process.env.DRIZZLE_MIGRATIONS_SUFFIX || config.drizzle?.migrations?.suffix,
        },
      },
    };
  }

  public getConfig(): Config {
    return this.config;
  }

  public getEnvironment(): string {
    return this.env;
  }

  public isDevelopment(): boolean {
    return this.env === 'dev';
  }

  public isStaging(): boolean {
    return this.env === 'staging';
  }

  public isProduction(): boolean {
    return this.env === 'prod';
  }
}

export const configLoader = ConfigLoader.getInstance();
export type { Config };
