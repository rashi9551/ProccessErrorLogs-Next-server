
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

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
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
