# Kafka Services Implementation Guide

## Introduction

This section provides comprehensive guidance on implementing Apache Kafka services for event-driven microservices architecture. The implementation covers Kafka cluster setup, producer/consumer patterns, reliability mechanisms, and operational considerations using KafkaJS with Bun runtime.

## Kafka Cluster Infrastructure

### Docker Compose Configuration

Set up a 2-broker Kafka cluster using KRaft mode (without Zookeeper):

```yaml
# infra/kafka/docker-compose.yml
version: '3.9'

services:
  kafka-1:
    image: bitnami/kafka:3.7
    container_name: kafka-1
    hostname: kafka-1
    ports:
      - '19092:9092'
    environment:
      # KRaft mode configuration
      KAFKA_ENABLE_KRAFT: 'yes'
      KAFKA_CFG_NODE_ID: '1'
      KAFKA_CFG_PROCESS_ROLES: 'broker,controller'
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      # Listener configuration
      KAFKA_CFG_LISTENERS: 'PLAINTEXT://:9092,CONTROLLER://:9093'
      KAFKA_CFG_ADVERTISED_LISTENERS: 'PLAINTEXT://localhost:19092,PLAINTEXT://localhost:29092'
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: '1@kafka-1:9093,2@kafka-2:9093'
      # Replication and durability
      KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR: '2'
      KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '2'
      KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR: '1'
      # Performance tuning
      KAFKA_CFG_NUM_NETWORK_THREADS: '8'
      KAFKA_CFG_NUM_IO_THREADS: '16'
      KAFKA_CFG_SOCKET_SEND_BUFFER_BYTES: '102400'
      KAFKA_CFG_SOCKET_RECEIVE_BUFFER_BYTES: '102400'
      KAFKA_CFG_SOCKET_REQUEST_MAX_BYTES: '104857600'
      # Log configuration
      KAFKA_CFG_LOG_RETENTION_HOURS: '168'
      KAFKA_CFG_LOG_SEGMENT_BYTES: '1073741824'
      KAFKA_CFG_LOG_RETENTION_CHECK_INTERVAL_MS: '300000'
    volumes:
      - kafka_1_data:/bitnami/kafka
    networks:
      - kafka-network

  kafka-2:
    image: bitnami/kafka:3.7
    container_name: kafka-2
    hostname: kafka-2
    ports:
      - '29092:9092'
    environment:
      # KRaft mode configuration
      KAFKA_ENABLE_KRAFT: 'yes'
      KAFKA_CFG_NODE_ID: '2'
      KAFKA_CFG_PROCESS_ROLES: 'broker,controller'
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      # Listener configuration
      KAFKA_CFG_LISTENERS: 'PLAINTEXT://:9092,CONTROLLER://:9093'
      KAFKA_CFG_ADVERTISED_LISTENERS: 'PLAINTEXT://localhost:29092,PLAINTEXT://localhost:19092'
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: '1@kafka-1:9093,2@kafka-2:9093'
      # Replication and durability
      KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR: '2'
      KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '2'
      KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR: '1'
      # Performance tuning
      KAFKA_CFG_NUM_NETWORK_THREADS: '8'
      KAFKA_CFG_NUM_IO_THREADS: '16'
      KAFKA_CFG_SOCKET_SEND_BUFFER_BYTES: '102400'
      KAFKA_CFG_SOCKET_RECEIVE_BUFFER_BYTES: '102400'
      KAFKA_CFG_SOCKET_REQUEST_MAX_BYTES: '104857600'
      # Log configuration
      KAFKA_CFG_LOG_RETENTION_HOURS: '168'
      KAFKA_CFG_LOG_SEGMENT_BYTES: '1073741824'
      KAFKA_CFG_LOG_RETENTION_CHECK_INTERVAL_MS: '300000'
    volumes:
      - kafka_2_data:/bitnami/kafka
    networks:
      - kafka-network

  # Optional: Kafka UI for monitoring
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    ports:
      - '8080:8080'
    environment:
      KAFKA_CLUSTERS_0_NAME: 'local'
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: 'kafka-1:9092,kafka-2:9092'
      KAFKA_CLUSTERS_0_ZOOKEEPER: ''
    depends_on:
      - kafka-1
      - kafka-2
    networks:
      - kafka-network
    driver: bridge
```

### Cluster Management Commands

```bash
# Start Kafka cluster
docker compose -f infra/kafka/docker-compose.yml up -d

# Stop Kafka cluster
docker compose -f infra/kafka/docker-compose.yml down

# View logs
docker compose -f infra/kafka/docker-compose.yml logs -f kafka-1

# Scale brokers (for testing)
docker compose -f infra/kafka/docker-compose.yml up -d --scale kafka-1=2
```

## Kafka Client Configuration

### Environment Variables

```bash
# Kafka Connection Configuration
KAFKA_BROKERS="localhost:19092,localhost:29092"
KAFKA_CLIENT_ID="cqrs-demo"
KAFKA_SSL="false"
KAFKA_SASL_MECHANISM=""
KAFKA_USERNAME=""
KAFKA_PASSWORD=""

# Producer Configuration
KAFKA_PRODUCER_BATCH_SIZE="16384"
KAFKA_PRODUCER_LINGER_MS="5"
KAFKA_PRODUCER_COMPRESSION_TYPE="gzip"
KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS="5"
KAFKA_PRODUCER_ENABLE_IDEMPOTENCE="true"

# Consumer Configuration
KAFKA_CONSUMER_SESSION_TIMEOUT_MS="30000"
KAFKA_CONSUMER_HEARTBEAT_INTERVAL_MS="3000"
KAFKA_CONSUMER_MAX_POLL_RECORDS="500"
KAFKA_CONSUMER_AUTO_OFFSET_RESET="earliest"
KAFKA_CONSUMER_ENABLE_AUTO_COMMIT="false"
```

### Kafka Client Factory

Implement a centralized Kafka client factory with proper configuration:

```typescript
// packages/common/src/kafka.ts
import { Kafka, logLevel, Producer, Consumer } from 'kafkajs';
import logger from './logger';

// Kafka client configuration
export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'cqrs-demo',
  brokers: (process.env.KAFKA_BROKERS || '').split(',').map(s => s.trim()),
  logLevel: logLevel.INFO,
  // SSL configuration
  ssl:
    process.env.KAFKA_SSL === 'true'
      ? {
          rejectUnauthorized: true,
        }
      : undefined,
  // SASL configuration
  sasl: process.env.KAFKA_USERNAME
    ? {
        mechanism: (process.env.KAFKA_SASL_MECHANISM || 'plain') as any,
        username: process.env.KAFKA_USERNAME!,
        password: process.env.KAFKA_PASSWORD!,
      }
    : undefined,
  // Connection timeout
  requestTimeout: 30000,
  // Retry configuration
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

// Producer factory with optimized configuration
export async function createProducer(): Promise<Producer> {
  const producer = kafka.producer({
    // Enable idempotent producer for exactly-once semantics
    idempotent: true,
    // Allow automatic topic creation for development
    allowAutoTopicCreation: process.env.NODE_ENV !== 'production',
    // Batch configuration
    maxWaitTimeInMs: parseInt(process.env.KAFKA_PRODUCER_LINGER_MS || '5'),
    batchSize: parseInt(process.env.KAFKA_PRODUCER_BATCH_SIZE || '16384'),
    // Compression
    compressionTypes: [(process.env.KAFKA_PRODUCER_COMPRESSION_TYPE as any) || 'gzip'],
    // Transaction configuration
    transactionTimeout: 60000,
    // Connection configuration
    maxInFlightRequests: parseInt(process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS || '5'),
  });

  // Event listeners
  producer.on('producer.connect', () => {
    logger.info('Kafka producer connected');
  });

  producer.on('producer.disconnect', () => {
    logger.warn('Kafka producer disconnected');
  });

  await producer.connect();
  return producer;
}

// Consumer factory with optimized configuration
export async function createConsumer(groupId: string): Promise<Consumer> {
  const consumer = kafka.consumer({
    groupId,
    // Session management
    sessionTimeout: parseInt(process.env.KAFKA_CONSUMER_SESSION_TIMEOUT_MS || '30000'),
    heartbeatInterval: parseInt(process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL_MS || '3000'),
    // Polling configuration
    maxWaitTimeInMs: 5000,
    maxPollRecords: parseInt(process.env.KAFKA_CONSUMER_MAX_POLL_RECORDS || '500'),
    // Offset management
    autoOffsetReset: (process.env.KAFKA_CONSUMER_AUTO_OFFSET_RESET as any) || 'earliest',
    autoCommit: process.env.KAFKA_CONSUMER_ENABLE_AUTO_COMMIT === 'true',
    // Partition assignment strategy
    partitionAssigners: [
      assignment => {
        // Custom partition assignment logic if needed
        return assignment;
      },
    ],
  });

  // Event listeners
  consumer.on('consumer.connect', () => {
    logger.info(`Kafka consumer connected (group: ${groupId})`);
  });

  consumer.on('consumer.disconnect', () => {
    logger.warn(`Kafka consumer disconnected (group: ${groupId})`);
  });

  await consumer.connect();
  return consumer;
}

// Admin client for topic management
export async function createAdmin() {
  const admin = kafka.admin();
  await admin.connect();
  return admin;
}
```

## Topic Management

### Topic Configuration

Define topic configurations for different use cases:

```typescript
// packages/common/src/topics.ts
export interface TopicConfig {
  topic: string;
  partitions: number;
  replicationFactor: number;
  config?: Record<string, string>;
}

export const TOPICS: Record<string, TopicConfig> = {
  // Business events
  'users.created': {
    topic: 'users.created',
    partitions: 3,
    replicationFactor: 2,
    config: {
      'retention.ms': '604800000', // 7 days
      'cleanup.policy': 'delete',
    },
  },
  'products.created': {
    topic: 'products.created',
    partitions: 6,
    replicationFactor: 2,
    config: {
      'retention.ms': '604800000', // 7 days
      'cleanup.policy': 'delete',
    },
  },
  'products.updated': {
    topic: 'products.updated',
    partitions: 6,
    replicationFactor: 2,
    config: {
      'retention.ms': '604800000', // 7 days
      'cleanup.policy': 'delete',
    },
  },
  'products.deleted': {
    topic: 'products.deleted',
    partitions: 6,
    replicationFactor: 2,
    config: {
      'retention.ms': '604800000', // 7 days
      'cleanup.policy': 'delete',
    },
  },

  // Notification events
  'notifications.send': {
    topic: 'notifications.send',
    partitions: 4,
    replicationFactor: 2,
    config: {
      'retention.ms': '86400000', // 1 day
      'cleanup.policy': 'delete',
      'message.timestamp.type': 'LogAppendTime',
    },
  },

  // Reliability patterns
  'events.retry': {
    topic: 'events.retry',
    partitions: 3,
    replicationFactor: 2,
    config: {
      'retention.ms': '604800000', // 7 days
      'cleanup.policy': 'delete',
      'message.timestamp.type': 'LogAppendTime',
    },
  },
  'events.dlq': {
    topic: 'events.dlq',
    partitions: 3,
    replicationFactor: 2,
    config: {
      'retention.ms': '2592000000', // 30 days
      'cleanup.policy': 'delete',
      'message.timestamp.type': 'LogAppendTime',
    },
  },
};
```

## Producer Implementation

### Event Producer Pattern

Implement robust event producers with proper error handling and metadata:

```typescript
// apps/product-service/src/events/product-events.ts
import { createProducer } from '@common/kafka';
import logger from '@common/logger';

export interface ProductEvent {
  id: string;
  name: string;
  price: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventMetadata {
  idempotencyKey: string;
  eventType: string;
  occurredAt: string;
  version: string;
  source: string;
  correlationId?: string;
}

// Product created event producer
export async function productCreatedProducer(product: ProductEvent, correlationId?: string) {
  const producer = await createProducer();
  const topic = 'products.created';

  const metadata: EventMetadata = {
    idempotencyKey: product.id,
    eventType: 'product.created',
    occurredAt: new Date().toISOString(),
    version: '1.0',
    source: 'product-service',
    correlationId,
  };

  try {
    const result = await producer.send({
      topic,
      acks: -1, // Wait for all replicas
      timeout: 30000,
      messages: [
        {
          key: product.id,
          value: JSON.stringify({
            data: product,
            metadata,
          }),
          headers: {
            idempotencyKey: metadata.idempotencyKey,
            eventType: metadata.eventType,
            occurredAt: metadata.occurredAt,
            version: metadata.version,
            source: metadata.source,
            correlationId: correlationId || '',
          },
          timestamp: Date.now(),
        },
      ],
    });

    logger.info('Product created event published', {
      productId: product.id,
      topic,
      partition: result[0].partition,
      offset: result[0].offset,
    });
    return result;
  } catch (error) {
    logger.error('Failed to publish product created event', {
      productId: product.id,
      topic,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    await producer.disconnect();
  }
}
```

## Consumer Implementation

### Event Consumer Pattern

Implement robust consumers with idempotency and error handling:

```typescript
// apps/user-service/src/consumers/product-events.ts
import { createConsumer } from '@common/kafka';
import db from '@common/db';
import logger from '@common/logger';

interface EventPayload {
  data: any;
  metadata: {
    idempotencyKey: string;
    eventType: string;
    occurredAt: string;
    version: string;
    source: string;
    correlationId?: string;
  };
}

export async function startProductEventsConsumer() {
  const consumer = await createConsumer('user-service-product-events');

  // Subscribe to product events
  await consumer.subscribe({
    topic: 'products.created',
    fromBeginning: false,
  });

  await consumer.subscribe({
    topic: 'products.updated',
    fromBeginning: false,
  });

  await consumer.subscribe({
    topic: 'products.deleted',
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const key = message.key?.toString();
      const headers = Object.fromEntries(
        Object.entries(message.headers || {}).map(([k, v]) => [k, v?.toString()])
      );

      try {
        const payload: EventPayload = JSON.parse(message.value?.toString('utf8') || '{}');

        logger.info('Processing product event', {
          topic,
          key,
          eventType: payload.metadata.eventType,
          correlationId: payload.metadata.correlationId,
        });

        // Idempotency check (using Drizzle)
        const existingEvent = await db
          .select()
          .from(eventDedup)
          .where(eq(eventDedup.key, key))
          .limit(1)
          .execute();

        if (existingEvent[0]) {
          logger.info('Event already processed, skipping', {
            idempotencyKey: payload.metadata.idempotencyKey,
          });
          return;
        }

        // Process event based on type
        switch (payload.metadata.eventType) {
          case 'product.created':
            await handleProductCreated(payload.data, payload.metadata);
            break;
          case 'product.updated':
            await handleProductUpdated(payload.data, payload.metadata);
            break;
          case 'product.deleted':
            await handleProductDeleted(payload.data, payload.metadata);
            break;
          default:
            logger.warn('Unknown event type', {
              eventType: payload.metadata.eventType,
            });
        }

        // Mark event as processed
        await db.insert(eventDedup).values({
          key: payload.metadata.idempotencyKey,
        });

        logger.info('Event processed successfully', {
          topic,
          key,
          eventType: payload.metadata.eventType,
        });
      } catch (error) {
        logger.error('Failed to process message', {
          topic,
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
          headers,
        });

        // Send to retry topic for transient errors
        if (isTransientError(error)) {
          await sendToRetryTopic(topic, message, headers);
        } else {
          // Send to DLQ for permanent errors
          await sendToDLQ(topic, message, headers, error);
        }
      }
    },
  });
}

async function handleProductCreated(productData: any, metadata: any) {
  // Example: Update user statistics when product is created
  logger.info('Product created event handled', {
    productId: productData.id,
    ownerId: productData.ownerId,
  });
}

async function handleProductUpdated(productData: any, metadata: any) {
  // Example: Handle product updates
  logger.info('Product updated event handled', {
    productId: productData.id,
    ownerId: productData.ownerId,
  });
}

async function handleProductDeleted(productData: any, metadata: any) {
  // Example: Clean up related data when product is deleted
  logger.info('Product deleted event handled', {
    productId: productData.id,
    ownerId: productData.ownerId,
  });
}

function isTransientError(error: any): boolean {
  // Define what constitutes a transient error
  const transientErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'Network error', 'Timeout'];

  const errorMessage = error instanceof Error ? error.message : String(error);
  return transientErrors.some(err => errorMessage.includes(err));
}
```

## Monitoring and Observability

### Kafka Metrics Collection

Implement comprehensive monitoring for Kafka operations:

```typescript
// packages/common/src/kafka-metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Producer metrics
export const producerMessagesTotal = new Counter({
  name: 'kafka_producer_messages_total',
  help: 'Total number of messages produced',
  labelNames: ['topic', 'status'],
});

export const producerMessageDuration = new Histogram({
  name: 'kafka_producer_message_duration_seconds',
  help: 'Time taken to produce messages',
  labelNames: ['topic'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const producerErrorsTotal = new Counter({
  name: 'kafka_producer_errors_total',
  help: 'Total number of producer errors',
  labelNames: ['topic', 'error_type'],
});

// Consumer metrics
export const consumerMessagesTotal = new Counter({
  name: 'kafka_consumer_messages_total',
  help: 'Total number of messages consumed',
  labelNames: ['topic', 'status'],
});

export const consumerMessageDuration = new Histogram({
  name: 'kafka_consumer_message_duration_seconds',
  help: 'Time taken to process messages',
  labelNames: ['topic'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30],
});

export const consumerLag = new Gauge({
  name: 'kafka_consumer_lag',
  help: 'Consumer lag by topic and partition',
  labelNames: ['topic', 'partition'],
});

// Register metrics
register.registerMetric(producerMessagesTotal);
register.registerMetric(producerMessageDuration);
register.registerMetric(producerErrorsTotal);
register.registerMetric(consumerMessagesTotal);
register.registerMetric(consumerMessageDuration);
register.registerMetric(consumerLag);

// Metrics collection utilities
export function recordProducerSuccess(topic: string, duration: number) {
  producerMessagesTotal.inc({ topic, status: 'success' });
  producerMessageDuration.observe({ topic }, duration / 1000);
}

export function recordProducerError(topic: string, errorType: string) {
  producerMessagesTotal.inc({ topic, status: 'error' });
  producerErrorsTotal.inc({ topic, error_type });
}

export function recordConsumerSuccess(topic: string, duration: number) {
  consumerMessagesTotal.inc({ topic, status: 'success' });
  consumerMessageDuration.observe({ topic }, duration / 1000);
}

export function recordConsumerError(topic: string) {
  consumerMessagesTotal.inc({ topic, status: 'error' });
}
```

This comprehensive Kafka implementation provides a robust foundation for event-driven microservices with proper reliability patterns, monitoring, and testing strategies.
