import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    app: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
    }, {
        name: string;
        version: string;
    }>;
    database: z.ZodObject<{
        url: z.ZodString;
        pool: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            idleTimeoutMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
            idleTimeoutMs: number;
        }, {
            min: number;
            max: number;
            idleTimeoutMs: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        pool: {
            min: number;
            max: number;
            idleTimeoutMs: number;
        };
    }, {
        url: string;
        pool: {
            min: number;
            max: number;
            idleTimeoutMs: number;
        };
    }>;
    auth: z.ZodObject<{
        jwt: z.ZodObject<{
            secret: z.ZodString;
            expiresIn: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            secret: string;
            expiresIn: string;
        }, {
            secret: string;
            expiresIn: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        jwt: {
            secret: string;
            expiresIn: string;
        };
    }, {
        jwt: {
            secret: string;
            expiresIn: string;
        };
    }>;
    services: z.ZodObject<{
        userService: z.ZodObject<{
            port: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            port: number;
        }, {
            port: number;
        }>;
        productService: z.ZodObject<{
            port: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            port: number;
        }, {
            port: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        userService: {
            port: number;
        };
        productService: {
            port: number;
        };
    }, {
        userService: {
            port: number;
        };
        productService: {
            port: number;
        };
    }>;
    kafka: z.ZodObject<{
        clientId: z.ZodString;
        brokers: z.ZodArray<z.ZodString, "many">;
        ssl: z.ZodBoolean;
        sasl: z.ZodObject<{
            mechanism: z.ZodString;
            username: z.ZodString;
            password: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            mechanism: string;
            username: string;
            password: string;
        }, {
            mechanism: string;
            username: string;
            password: string;
        }>;
        producer: z.ZodObject<{
            batchSize: z.ZodNumber;
            lingerMs: z.ZodNumber;
            compressionType: z.ZodString;
            maxInFlightRequests: z.ZodNumber;
            enableIdempotence: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            batchSize: number;
            lingerMs: number;
            compressionType: string;
            maxInFlightRequests: number;
            enableIdempotence: boolean;
        }, {
            batchSize: number;
            lingerMs: number;
            compressionType: string;
            maxInFlightRequests: number;
            enableIdempotence: boolean;
        }>;
        consumer: z.ZodObject<{
            sessionTimeoutMs: z.ZodNumber;
            heartbeatIntervalMs: z.ZodNumber;
            maxPollRecords: z.ZodNumber;
            autoOffsetReset: z.ZodEnum<["earliest", "latest"]>;
            enableAutoCommit: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            sessionTimeoutMs: number;
            heartbeatIntervalMs: number;
            maxPollRecords: number;
            autoOffsetReset: "earliest" | "latest";
            enableAutoCommit: boolean;
        }, {
            sessionTimeoutMs: number;
            heartbeatIntervalMs: number;
            maxPollRecords: number;
            autoOffsetReset: "earliest" | "latest";
            enableAutoCommit: boolean;
        }>;
        topics: z.ZodRecord<z.ZodString, z.ZodObject<{
            partitions: z.ZodNumber;
            replicationFactor: z.ZodNumber;
            config: z.ZodRecord<z.ZodString, z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            partitions: number;
            replicationFactor: number;
            config: Record<string, string>;
        }, {
            partitions: number;
            replicationFactor: number;
            config: Record<string, string>;
        }>>;
    }, "strip", z.ZodTypeAny, {
        clientId: string;
        brokers: string[];
        ssl: boolean;
        sasl: {
            mechanism: string;
            username: string;
            password: string;
        };
        producer: {
            batchSize: number;
            lingerMs: number;
            compressionType: string;
            maxInFlightRequests: number;
            enableIdempotence: boolean;
        };
        consumer: {
            sessionTimeoutMs: number;
            heartbeatIntervalMs: number;
            maxPollRecords: number;
            autoOffsetReset: "earliest" | "latest";
            enableAutoCommit: boolean;
        };
        topics: Record<string, {
            partitions: number;
            replicationFactor: number;
            config: Record<string, string>;
        }>;
    }, {
        clientId: string;
        brokers: string[];
        ssl: boolean;
        sasl: {
            mechanism: string;
            username: string;
            password: string;
        };
        producer: {
            batchSize: number;
            lingerMs: number;
            compressionType: string;
            maxInFlightRequests: number;
            enableIdempotence: boolean;
        };
        consumer: {
            sessionTimeoutMs: number;
            heartbeatIntervalMs: number;
            maxPollRecords: number;
            autoOffsetReset: "earliest" | "latest";
            enableAutoCommit: boolean;
        };
        topics: Record<string, {
            partitions: number;
            replicationFactor: number;
            config: Record<string, string>;
        }>;
    }>;
    logging: z.ZodObject<{
        level: z.ZodEnum<["debug", "info", "warn", "error"]>;
        pretty: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        level: "debug" | "info" | "warn" | "error";
        pretty: boolean;
    }, {
        level: "debug" | "info" | "warn" | "error";
        pretty: boolean;
    }>;
    metrics: z.ZodObject<{
        enabled: z.ZodBoolean;
        collectDefaultMetrics: z.ZodBoolean;
        prefix: z.ZodString;
        buckets: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        collectDefaultMetrics: boolean;
        prefix: string;
        buckets: number[];
    }, {
        enabled: boolean;
        collectDefaultMetrics: boolean;
        prefix: string;
        buckets: number[];
    }>;
    security: z.ZodObject<{
        encryptionEnabled: z.ZodBoolean;
        keyRotationInterval: z.ZodNumber;
        auditLogging: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        encryptionEnabled: boolean;
        keyRotationInterval: number;
        auditLogging: boolean;
    }, {
        encryptionEnabled: boolean;
        keyRotationInterval: number;
        auditLogging: boolean;
    }>;
    features: z.ZodObject<{
        hotReload: z.ZodBoolean;
        autoMigrate: z.ZodBoolean;
        debugMode: z.ZodBoolean;
        mockExternalServices: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        hotReload: boolean;
        autoMigrate: boolean;
        debugMode: boolean;
        mockExternalServices: boolean;
    }, {
        hotReload: boolean;
        autoMigrate: boolean;
        debugMode: boolean;
        mockExternalServices: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    app: {
        name: string;
        version: string;
    };
    database: {
        url: string;
        pool: {
            min: number;
            max: number;
            idleTimeoutMs: number;
        };
    };
    auth: {
        jwt: {
            secret: string;
            expiresIn: string;
        };
    };
    services: {
        userService: {
            port: number;
        };
        productService: {
            port: number;
        };
    };
    kafka: {
        clientId: string;
        brokers: string[];
        ssl: boolean;
        sasl: {
            mechanism: string;
            username: string;
            password: string;
        };
        producer: {
            batchSize: number;
            lingerMs: number;
            compressionType: string;
            maxInFlightRequests: number;
            enableIdempotence: boolean;
        };
        consumer: {
            sessionTimeoutMs: number;
            heartbeatIntervalMs: number;
            maxPollRecords: number;
            autoOffsetReset: "earliest" | "latest";
            enableAutoCommit: boolean;
        };
        topics: Record<string, {
            partitions: number;
            replicationFactor: number;
            config: Record<string, string>;
        }>;
    };
    logging: {
        level: "debug" | "info" | "warn" | "error";
        pretty: boolean;
    };
    metrics: {
        enabled: boolean;
        collectDefaultMetrics: boolean;
        prefix: string;
        buckets: number[];
    };
    security: {
        encryptionEnabled: boolean;
        keyRotationInterval: number;
        auditLogging: boolean;
    };
    features: {
        hotReload: boolean;
        autoMigrate: boolean;
        debugMode: boolean;
        mockExternalServices: boolean;
    };
}, {
    app: {
        name: string;
        version: string;
    };
    database: {
        url: string;
        pool: {
            min: number;
            max: number;
            idleTimeoutMs: number;
        };
    };
    auth: {
        jwt: {
            secret: string;
            expiresIn: string;
        };
    };
    services: {
        userService: {
            port: number;
        };
        productService: {
            port: number;
        };
    };
    kafka: {
        clientId: string;
        brokers: string[];
        ssl: boolean;
        sasl: {
            mechanism: string;
            username: string;
            password: string;
        };
        producer: {
            batchSize: number;
            lingerMs: number;
            compressionType: string;
            maxInFlightRequests: number;
            enableIdempotence: boolean;
        };
        consumer: {
            sessionTimeoutMs: number;
            heartbeatIntervalMs: number;
            maxPollRecords: number;
            autoOffsetReset: "earliest" | "latest";
            enableAutoCommit: boolean;
        };
        topics: Record<string, {
            partitions: number;
            replicationFactor: number;
            config: Record<string, string>;
        }>;
    };
    logging: {
        level: "debug" | "info" | "warn" | "error";
        pretty: boolean;
    };
    metrics: {
        enabled: boolean;
        collectDefaultMetrics: boolean;
        prefix: string;
        buckets: number[];
    };
    security: {
        encryptionEnabled: boolean;
        keyRotationInterval: number;
        auditLogging: boolean;
    };
    features: {
        hotReload: boolean;
        autoMigrate: boolean;
        debugMode: boolean;
        mockExternalServices: boolean;
    };
}>;
type Config = z.infer<typeof ConfigSchema>;
declare class ConfigLoader {
    private static instance;
    private config;
    private env;
    private constructor();
    static getInstance(): ConfigLoader;
    private loadConfig;
    private loadConfigFile;
    private mergeConfigs;
    private applyEnvironmentVariables;
    getConfig(): Config;
    getEnvironment(): string;
    isDevelopment(): boolean;
    isStaging(): boolean;
    isProduction(): boolean;
}
export declare const configLoader: ConfigLoader;
export type { Config };
