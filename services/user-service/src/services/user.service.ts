/**
 * User Service — Business Logic
 */

import { User, IUserDoc } from '../models';
import { NotFoundError, BadRequestError, buildPaginationMeta } from '@auralux/common';
import { RedisCacheManager } from '@auralux/redis-client';

export class UserService {
  constructor(private redis: RedisCacheManager) {}

  /** Create user profile (triggered by Kafka user.registered event) */
  async createUser(data: {
    userId: string;
    email: string;
    username: string;
    displayName: string;
  }): Promise<IUserDoc> {
    const user = await User.create({
      userId: data.userId,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      displayName: data.displayName,
    });

    return user;
  }

  /** Get user profile by ID */
  async getUserById(userId: string): Promise<IUserDoc> {
    // Cache-aside: check Redis first
    const cached = await this.redis.get<IUserDoc>(`user:${userId}`);
    if (cached) return cached;

    const user = await User.findOne({ userId });
    if (!user) throw new NotFoundError('User');

    // Cache for 5 minutes
    await this.redis.set(`user:${userId}`, user.toObject(), 300);
    return user;
  }

  /** Update user profile */
  async updateUser(userId: string, updates: Partial<{
    displayName: string;
    avatarUrl: string;
    preferences: Partial<IUserDoc['preferences']>;
  }>): Promise<IUserDoc> {
    const updateObj: Record<string, unknown> = {};

    if (updates.displayName) updateObj.displayName = updates.displayName;
    if (updates.avatarUrl) updateObj.avatarUrl = updates.avatarUrl;
    if (updates.preferences) {
      for (const [key, value] of Object.entries(updates.preferences)) {
        updateObj[`preferences.${key}`] = value;
      }
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updateObj },
      { new: true, runValidators: true }
    );

    if (!user) throw new NotFoundError('User');

    // Invalidate cache
    await this.redis.del(`user:${userId}`);

    return user;
  }

  /** Update subscription tier */
  async updateSubscription(userId: string, tier: string): Promise<IUserDoc> {
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { subscription: tier } },
      { new: true }
    );
    if (!user) throw new NotFoundError('User');

    await this.redis.del(`user:${userId}`);
    return user;
  }
}
