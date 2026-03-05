/**
 * User Service — Kafka Event Consumers
 * Listens for auth events to create/update user profiles.
 */

import { KafkaEventBus } from '@auralux/kafka-client';
import { KafkaTopic, UserRegisteredPayload } from '@auralux/shared-types';
import { UserService } from '../services';
import { createLogger } from '@auralux/logger';

const logger = createLogger({ serviceName: 'user-service' });

export async function registerEventConsumers(
  kafka: KafkaEventBus,
  userService: UserService
): Promise<void> {
  /** Consume user.registered → create user profile */
  await kafka.subscribe<UserRegisteredPayload>(
    KafkaTopic.USER_REGISTERED,
    async (payload) => {
      logger.info('Processing user.registered event', { userId: payload.userId });
      try {
        await userService.createUser({
          userId: payload.userId,
          email: payload.email,
          username: payload.username,
          displayName: payload.username, // Default display name
        });
        logger.info('User profile created', { userId: payload.userId });
      } catch (error) {
        logger.error('Failed to create user profile', { userId: payload.userId, error });
      }
    }
  );
}
