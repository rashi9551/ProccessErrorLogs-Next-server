// lib/queue.ts
import { Queue } from 'bullmq';

let logProcessingQueue: Queue;

// Singleton to ensure we don't create multiple instances of the same queue
export function getLogProcessingQueue() {
  if (!logProcessingQueue) {
    logProcessingQueue = new Queue("log-processing", {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  
  return logProcessingQueue;
}

// For graceful shutdown when using Next.js
export async function closeQueues() {
  if (logProcessingQueue) {
    await logProcessingQueue.close();
  }
}