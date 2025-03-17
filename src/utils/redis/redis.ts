// utils/queue.ts
import Redis from 'ioredis';

// Singleton pattern for Redis connection
let redisConnection: Redis | null = null;

export function getQueueConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      maxRetriesPerRequest: null,
    });

    // Log when connection issues occur
    redisConnection.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  return redisConnection;
}

// For graceful shutdown
export async function closeRedisConnection() {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}