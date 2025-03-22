// app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from "@/utils/supabase/server";
import { ALL_LOG_LEVELS } from '@/utils/constant';
import { rateLimitMiddleware } from '@/utils/middleware/rateLimitterMiddleware';


async function handler(req: NextRequest) {
  try {
    // Get the job_id from query params if provided
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    
    // Create authenticated Supabase client
    const supabase = await createClientForServer();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let stats;
    
    if (jobId) {
      // First fetch the job to ensure it belongs to this user
      const { data: jobData, error: jobError } = await supabase
        .from('job_status')
        .select('job_id')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .single();
      
      if (jobError || !jobData) {
        return NextResponse.json(
          { error: 'Job not found or access denied' },
          { status: 404 }
        );
      }
      
      // Now fetch the stats for this job
      const { data, error } = await supabase
        .from('log_stats')
        .select('*')
        .eq('job_id', jobId)
        .single();
      
      if (error) {
        return NextResponse.json(
          { error: 'Error fetching stats', details: error.message },
          { status: 500 }
        );
      }
      
      // Process the raw data into our required format
      stats = processJobStats(data);
    } else {
      // First get jobs belonging to this user
      const { data: userJobs, error: jobsError } = await supabase
        .from('job_status')
        .select('job_id')
        .eq('user_id', user.id);
        
      if (jobsError) {
        return NextResponse.json(
          { error: 'Error fetching jobs', details: jobsError.message },
          { status: 500 }
        );
      }
      
      // Extract job IDs
      const userJobIds = userJobs.map(job => job.job_id);
      
      if (userJobIds.length === 0) {
        // Return empty stats if user has no jobs
        return NextResponse.json({
          errors: { total: 0, details: [] },
          ips: { unique: 0, top: [] },
          keywords: { total: 0, matches: [] },
          levels: { total: 0, details: [] }
        });
      }
      
      // Fetch stats for these jobs
      const { data: logStats, error: statsError } = await supabase
        .from('log_stats')
        .select('*')
        .in('job_id', userJobIds)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (statsError) {
        return NextResponse.json(
          { error: 'Error fetching stats', details: statsError.message },
          { status: 500 }
        );
      }
      
      // Process the data for overview stats
      stats = processAggregatedStats(logStats);
    }
    
    return NextResponse.json(stats);
  } catch (e) {
    console.error('Error in /api/stats:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = rateLimitMiddleware(handler);


// Helper function to process a single job's stats
function processJobStats(jobStats: any) {
  if (!jobStats) {
    return {
      errors: { total: 0, details: [] },
      ips: { unique: 0, top: [] },
      keywords: { total: 0, matches: [] },
      levels: { total: 0, details: ALL_LOG_LEVELS.map(level => ({ type: level, count: 0 })) }
    };
  }

  // Process error levels
  const errorLevels: Record<string, number> = {};
  let totalErrors = 0;
  
  // Process all log levels
  const levelCounts: Record<string, number> = {};
  let totalLogs = 0;
  
  const levelDist = jobStats.level_distribution || {};
  
  // Initialize all possible log levels to ensure they all appear in the output
  ALL_LOG_LEVELS.forEach(level => {
    levelCounts[level] = 0;
  });
  
  // Normalize level names to uppercase for consistency
  Object.entries(levelDist).forEach(([level, count]) => {
    const normalizedLevel = level.toUpperCase();
    const countNum = count as number;
    
    // Include all levels, even if count is 0
    levelCounts[normalizedLevel] = (levelCounts[normalizedLevel] || 0) + countNum;
    
    if (countNum > 0) {
      totalLogs += countNum;
      
      // Track errors separately for backward compatibility
      if (normalizedLevel === 'ERROR' || normalizedLevel === 'CRITICAL') {
        totalErrors += countNum;
        errorLevels[normalizedLevel] = (errorLevels[normalizedLevel] || 0) + countNum;
      }
    }
  });
  
  // Format the level details for ALL levels, including those with count = 0
  const levelDetails = ALL_LOG_LEVELS.map(type => ({
    type,
    count: levelCounts[type] || 0
  })).sort((a, b) => b.count - a.count);
  
  // Format the error details
  const errorDetails = Object.entries(errorLevels)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  // Process keywords
  const keywordFrequency = jobStats.keyword_frequency || {};
  let totalKeywords = 0;
  
  // Extract error keywords
  const keywordMatches = Object.entries(keywordFrequency)
    .map(([word, count]) => {
      totalKeywords += count as number;
      return { word, count: count as number };
    })
    .sort((a, b) => b.count - a.count);
  
  // Process IPs
  const topIps = (jobStats.top_ips || []).map((ip: any) => ({
    address: ip.ip,
    count: ip.count
  }));
  
  return {
    errors: {
      total: totalErrors,
      details: errorDetails
    },
    ips: {
      unique: jobStats.unique_ips || 0,
      top: topIps
    },
    keywords: {
      total: totalKeywords,
      matches: keywordMatches
    },
    levels: {
      total: totalLogs,
      details: levelDetails
    }
  };
}

// Helper function to process aggregated stats
function processAggregatedStats(logStats: any[]) {
  if (!logStats || logStats.length === 0) {
    return {
      errors: { total: 0, details: [] },
      ips: { unique: 0, top: [] },
      keywords: { total: 0, matches: [] },
      levels: { total: 0, details: [] }
    };
  }

  // Aggregate error levels
  const errorLevels: Record<string, number> = {};
  let totalErrors = 0;
  
  // Track all log levels
  const allLevels: Record<string, number> = {};
  let totalLogs = 0;
  
  // Aggregate keywords
  const keywordCounts: Record<string, number> = {};
  let totalKeywords = 0;
  
  // Track unique IPs and their counts across all jobs
  const allIps: Record<string, number> = {};
  
  logStats.forEach(stat => {
    // Process level distribution for all levels
    const levelDist = stat.level_distribution || {};
    
    Object.entries(levelDist).forEach(([level, count]) => {
      const normalizedLevel = level.toUpperCase();
      const countNum = count as number;
      
      // Only include levels with count > 0
      if (countNum > 0) {
        totalLogs += countNum;
        allLevels[normalizedLevel] = (allLevels[normalizedLevel] || 0) + countNum;
        
        // Still track errors separately
        if (normalizedLevel === 'ERROR' || normalizedLevel === 'CRITICAL') {
          totalErrors += countNum;
          errorLevels[normalizedLevel] = (errorLevels[normalizedLevel] || 0) + countNum;
        }
      }
    });
    
    // Process keywords
    const keywords = stat.keyword_frequency || {};
    Object.entries(keywords).forEach(([keyword, count]) => {
      totalKeywords += count as number;
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + (count as number);
    });
    
    // Process IPs
    const ipOccurrences = stat.ip_occurrences || {};
    Object.entries(ipOccurrences).forEach(([ip, count]) => {
      allIps[ip] = (allIps[ip] || 0) + (count as number);
    });
  });
  
  // Format the error details
  const errorDetails = Object.entries(errorLevels)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  // Format the level details for all levels with count > 0
  const levelDetails = Object.entries(allLevels)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  // Format the keyword matches
  const keywordMatches = Object.entries(keywordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  
  // Format the top IPs
  const topIps = Object.entries(allIps)
    .map(([address, count]) => ({ address, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    errors: {
      total: totalErrors,
      details: errorDetails
    },
    ips: {
      unique: Object.keys(allIps).length,
      top: topIps
    },
    keywords: {
      total: totalKeywords,
      matches: keywordMatches
    },
    levels: {
      total: totalLogs,
      details: levelDetails
    }
  };
}


