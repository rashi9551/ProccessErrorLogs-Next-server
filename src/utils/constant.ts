// Define the error keywords

// Define all possible log levels
export const ALL_LOG_LEVELS = ['CRITICAL', 'ERROR', 'WARN', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];

export const initialValueQueueStats={
    counts: {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    },
    priorityJobs: [],
    recentJobs: []
  }

  export const dashboardStats={ 
    errors: { total: 0, details: [] }, 
    ips: { unique: 0, top: [] }, 
    keywords: { total: 0, matches: [] }, 
    levels:{total:0,details:[]}
  }