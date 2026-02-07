// Common TypeScript types used across services

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface EventMetadata {
  idempotencyKey: string;
  eventType: string;
  occurredAt: string;
  version: string;
  source: string;
  correlationId?: string;
}

export interface EventPayload<T> {
  data: T;
  metadata: EventMetadata;
}

export interface BatchMessage {
  key: string;
  value: any;
  headers?: Record<string, string>;
}

export interface BatchResult {
  ok: boolean;
  result?: any;
  error?: string;
  failedMessages?: BatchMessage[];
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  details: {
    timestamp: string;
    uptime: number;
    [key: string]: any;
  };
}

export interface KafkaHealthStatus {
  status: 'healthy' | 'unhealthy';
  details: {
    clusterConnected: boolean;
    topicsAvailable: string[];
    producerConnected: boolean;
    consumerConnected: boolean;
    lastCheck: string;
    error?: string;
  };
}

export interface TopicConfig {
  partitions: number;
  replicationFactor: number;
  config: Record<string, string>;
}

export interface EnvironmentTopicConfig {
  [topicName: string]: TopicConfig;
}

export interface SecurityConfig {
  encryptionEnabled: boolean;
  keyRotationInterval: number;
  auditLogging: boolean;
}

export interface MigrationConfig {
  autoMigrate: boolean;
  backupBeforeMigrate: boolean;
  resetOnStart: boolean;
}

export interface MetricsConfig {
  enabled: boolean;
  collectDefaultMetrics: boolean;
  prefix: string;
  buckets: number[];
}
