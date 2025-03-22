import { Socket } from "socket.io-client";

export interface JobStatus {
  processed_lines: number;
  valid_entries: number;
  job_id: string;
  file_name: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  updated_at: string;
  error_message?: string;
}
export interface QueueJob {
  id: string;
  name: string;
  priority: number;
  state?: string;
  data: {
    fileName: string;
    fileSize: number;
    userId: string;
  };
  timestamp?: number;
}

export interface QueueStats {
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  priorityJobs: QueueJob[];
  recentJobs: QueueJob[];
}

export interface QueueDetailsProps {
  queueStats: QueueStats;
  isLoading: boolean;
  onRefresh: () => void;
}
export interface ErrorDetail {
  type: string;
  count: number;
}

export interface IpDetail {
  address: string;
  count: number;
}

export interface KeywordDetail {
  word: string;
  count: number;
}

export interface Stats {
  errors: {
    total: number;
    details: ErrorDetail[];
  };
  ips: {
    unique: number;
    top: IpDetail[];
  };
  keywords: {
    total: number;
    matches: KeywordDetail[];
  };
  levels: {
    total: number;
    details: LevelDetail[];
  };
}

interface LevelDetail {
  type: string;
  count: number;
}



export interface JobDetailsTableProps {
  stats: Stats;
  isLoadingStats: boolean;
  selectedJobId: string | null;
  onBackClick: () => void;
}


export interface QueueState{
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  priorityJobs: any[];
  recentJobs: any[];
}

export interface ConsoleMessage {
  id: number;
  timestamp: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

export interface ConsoleComponentProps {
  socketConnection: Socket | null;
}

export interface FileUploadComponentProps {
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  isUploading: boolean;
  acceptedFileTypes?: string[];
  currentFile: File | null; // Add this prop
}

export interface RecentJobsProps {
  jobs: JobStatus[];
  onSelectJob: (jobId: string) => void;
  selectedJobId: string | null;
}

export interface StatsPanelProps {
  stats: Stats;
  selectedJobId: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}