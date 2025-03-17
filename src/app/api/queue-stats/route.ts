// app/api/queue-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from "@/utils/supabase/server";
import { Queue } from 'bullmq';
import { getQueueConnection } from '@/utils/redis/redis';

export async function GET(req: NextRequest) {
  try {
    // Create authenticated Supabase client
    const supabase = await createClientForServer();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to the queue
    const connection = getQueueConnection();
    const logProcessingQueue = new Queue('log-processing', { connection });

    // Get queue statistics
    const [
      waitingCount,
      activeCount,
      completedCount,
      failedCount,
      delayedCount,
      priorityJobs,
      recentJobs
    ] = await Promise.all([
      logProcessingQueue.getWaitingCount(),
      logProcessingQueue.getActiveCount(),
      logProcessingQueue.getCompletedCount(),
      logProcessingQueue.getFailedCount(),
      logProcessingQueue.getDelayedCount(),
      logProcessingQueue.getJobs(['waiting'], 0, 5, true), // Get top 5 waiting jobs by priority
      logProcessingQueue.getJobs(['active', 'waiting', 'delayed'], 0, 10) // Get 10 most recent jobs
    ]);

    // Format jobs for display
    const formattedPriorityJobs = priorityJobs.map(job => ({
      id: job.id,
      name: job.name,
      priority: job.opts.priority,
      data: {
        fileName: job.data.originalFilename,
        fileSize: job.data.fileSize,
        userId: job.data.userId
      }
    }));

    const formattedRecentJobs = await Promise.all(recentJobs.map(async (job) => ({
        id: job.id,
        name: job.name,
        state: await job.getState(),
        priority: job.opts.priority,
        data: {
            fileName: job.data.originalFilename,
            fileSize: job.data.fileSize,
            userId: job.data.userId
        },
        timestamp: job.timestamp
    })));

    // Return the statistics
    return NextResponse.json({
      counts: {
        waiting: waitingCount,
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        delayed: delayedCount
      },
      priorityJobs: formattedPriorityJobs,
      recentJobs: formattedRecentJobs
    });
  } catch (error) {
    console.error('Error fetching queue statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue statistics' },
      { status: 500 }
    );
  }
}