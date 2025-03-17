// lib/queue.ts
import { Queue, QueueEvents } from 'bullmq';
import { getQueueConnection, closeRedisConnection } from '@/utils/redis/redis';

let logProcessingQueue: Queue;
let queueEvents: QueueEvents;

// Singleton to ensure we don't create multiple instances of the same queue
export function getLogProcessingQueue() {
  if (!logProcessingQueue) {
    // Reuse the Redis connection from the utility function
    const connection = getQueueConnection();

    logProcessingQueue = new Queue("log-processing", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,    // Keep the latest 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    // Setup queue events monitoring
    queueEvents = new QueueEvents("log-processing", { connection });
    
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`Job ${jobId} completed with result:`, returnvalue);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed with error: ${failedReason}`);
    });

    queueEvents.on('progress', ({ jobId, data }:any) => {
      console.log(`Job ${jobId} reported progress: processed ${data?.processedLines || 0} lines`);
    });
  }

  return logProcessingQueue;
}

// Helper function to calculate priority based on file size
export function calculatePriority(fileSize: number): number {
  // Smaller files get higher priority (lower number)
  // Files under 1MB get priority 1
  if (fileSize < 1024 * 1024) return 1;
  // Files under 10MB get priority 2
  if (fileSize < 10 * 1024 * 1024) return 2;
  // Files under 50MB get priority 3
  if (fileSize < 50 * 1024 * 1024) return 3;
  // Files under 100MB get priority 4
  if (fileSize < 100 * 1024 * 1024) return 4;
  // Files over 100MB get priority 5
  return 5;
}

// For graceful shutdown when using Next.js
export async function closeQueues() {
  if (queueEvents) {
    await queueEvents.close();
  }
  
  if (logProcessingQueue) {
    await logProcessingQueue.close();
  }
  
  // Close the Redis connection
  await closeRedisConnection();
}