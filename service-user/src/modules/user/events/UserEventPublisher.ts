import { Service } from 'typedi';
import { createProducer } from '../../../helpers/kafka';
import logger from '../../../helpers/logger';
import { EventMetadata } from '../../../helpers/types';

// Define User type for event publishing
type User = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

@Service()
export class UserEventPublisher {
  async publishUserCreated(user: User): Promise<void> {
    const producer = await createProducer();
    const topic = 'users.created';

    const metadata: EventMetadata = {
      idempotencyKey: user.id,
      eventType: 'user.created',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      source: 'user-service',
    };

    try {
      const result = await producer.send({
        topic,
        acks: -1, // Wait for all replicas
        timeout: 30000,
        messages: [
          {
            key: user.id,
            value: JSON.stringify({
              data: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
              },
              metadata,
            }),
            headers: {
              idempotencyKey: metadata.idempotencyKey,
              eventType: metadata.eventType,
              occurredAt: metadata.occurredAt,
              version: metadata.version,
              source: metadata.source,
            },
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.info('User created event published', {
        userId: user.id,
        topic,
        partition: result[0].partition,
        offset: result[0].offset,
      });
    } catch (error) {
      logger.error('Failed to publish user created event', {
        userId: user.id,
        topic,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      await producer.disconnect();
    }
  }

  async publishUserRestored(user: User & { restoredAt: Date }): Promise<void> {
    const producer = await createProducer();
    const topic = 'users.restored';

    const metadata: EventMetadata = {
      idempotencyKey: user.id,
      eventType: 'user.restored',
      occurredAt: new Date().toISOString(),
      version: '1.0',
      source: 'user-service',
    };

    try {
      const result = await producer.send({
        topic,
        acks: -1,
        timeout: 30000,
        messages: [
          {
            key: user.id,
            value: JSON.stringify({
              data: {
                id: user.id,
                email: user.email,
                role: user.role,
                restoredAt: user.restoredAt,
              },
              metadata,
            }),
            headers: {
              idempotencyKey: metadata.idempotencyKey,
              eventType: metadata.eventType,
              occurredAt: metadata.occurredAt,
              version: metadata.version,
              source: metadata.source,
            },
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.info('User restored event published', {
        userId: user.id,
        topic,
        partition: result[0].partition,
        offset: result[0].offset,
      });
    } catch (error) {
      logger.error('Failed to publish user restored event', {
        userId: user.id,
        topic,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      await producer.disconnect();
    }
  }
}
