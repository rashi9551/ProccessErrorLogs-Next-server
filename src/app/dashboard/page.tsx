'use client';

import DashboardLoader from "@/components/shimmer/dashboardLoader";
import { userLogin, userLogout } from "@/utils/redux/slices/authSlice";
import { RootState } from "@/utils/redux/store";
import { signOut } from "@/action";
import createClientForBrowser from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { useEffect, useState, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from 'sonner';
import { JobStatus, QueueStatus, Stats } from "@/interfaces/interface";
import RecentJobs from "@/components/dashboard/ReacentJob";
import StatsPanel from "@/components/dashboard/StatusPanel";
import JobDetailsTable from "@/components/dashboard/JobDetails";
import FileUploadComponent from "@/components/dashboard/FileUpload";

export default function Dashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn);
  const userEmail = useSelector((state: RootState) => state.auth.email);
  
  // State for the dashboard
  const [stats, setStats] = useState<Stats>({ 
    errors: { total: 0, details: [] }, 
    ips: { unique: 0, top: [] }, 
    keywords: { total: 0, matches: [] }, 
    levels:{total:0,details:[]}
  });
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ waiting: 0, active: 0, completed: 0, failed: 0 });
  const [recentJobs, setRecentJobs] = useState<JobStatus[]>(() => []);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  const supabase = createClientForBrowser();
  
  // Check user session
  useEffect(() => {
    const checkUserSession = async () => {
      const { data: user, error } = await supabase.auth.getUser();

      if (user?.user?.email) {
        // Only dispatch if not already logged in
        if (!isLoggedIn) {
          dispatch(userLogin({ email: user.user.email, loggedIn: true }));
        }
        router.replace('/dashboard');
      } else {
        console.log(error);
        toast.error('Session expired, please login again');
        router.replace('/login');
      }
    };

    if (!isLoggedIn) {
      checkUserSession();
    } else {
      fetchDashboardData();
      fetchStats();
      setIsLoading(false);
    }
  }, [dispatch, router, isLoggedIn,selectedJobId]);



  const fetchDashboardData = async () => {
    try {
      // Fetch queue status
      const { data: queueData, error: queueError } = await supabase
        .from('job_status')
        .select('status, count')
        .select('status, count(*)')

      if (!queueError && queueData) {
        const newQueueStatus = {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0
        };
        
        queueData.forEach((item:any) => {
          if (item.status === 'PENDING') newQueueStatus.waiting = item.count;
          if (item.status === 'PROCESSING') newQueueStatus.active = item.count;
          if (item.status === 'COMPLETED') newQueueStatus.completed = item.count;
          if (item.status === 'FAILED') newQueueStatus.failed = item.count;
        });
        
        setQueueStatus(newQueueStatus);
      }

      // Fetch recent jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('job_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
      }
      
      setRecentJobs(jobs);
      
      // Fetch stats initially
      await fetchStats();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
  
      if (!token) {
        toast.error("Authentication required. Please login.");
        router.refresh();
        return;
      }
  
      // Build URL with job ID if selected
      const url = selectedJobId 
        ? `/api/stats?jobId=${selectedJobId}` 
        : '/api/stats';
  
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
  
      const data = await response.json();
      console.log(data,"delected jobid ",selectedJobId);
      
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
  
    setIsUploading(true);
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
  
      if (!token) {
        toast.error("Authentication required. Please login.")
        router.refresh()
        return;
      }
  
      const response = await fetch("/api/upload-logs", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Upload failed");
      }
  
      const data = await response.json();
      const jobId = data?.jobId;
      
      if (!jobId) {
        throw new Error("Server didn't return a valid job ID");
      }
      
      toast.success(`File uploaded. Job ID: ${jobId}`);
      
      // Update queue status
      setQueueStatus(prev => ({
        ...prev,
        waiting: prev.waiting + 1,
      }));
  
      setFile(null);
      
      // Refresh dashboard data after upload
      setTimeout(() => {
        fetchDashboardData();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleLogout = async () => {
    await signOut();
    dispatch(userLogout());
    toast.success('Logged out successfully');
    router.push("/login");
  };

  const handleRefresh = async () => {
    toast.info("Refreshing data...");
    try {
      await fetchDashboardData();
      await fetchStats()
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  if (isLoading) {
    return <DashboardLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Log Processing Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4 text-gray-600">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* File Upload */}
            <FileUploadComponent 
              onFileChange={handleFileChange}
              onUpload={handleUpload}
              isUploading={isUploading}
            />
            
            {selectedJobId ? (
              // Job Details View
              <JobDetailsTable
                  stats={stats}
                  isLoadingStats={isLoadingStats}
                  selectedJobId={selectedJobId}
                  onBackClick={() => setSelectedJobId(null)}
                />
            ) : (
              // Overview (Queue Status and Recent Jobs)
              <>
                {/* Queue Status */}
                <div className="bg-white p-4 rounded-lg shadow-md mt-6">
                  <h2 className="text-lg font-semibold mb-4">Queue Status</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="text-sm text-blue-800">Waiting</div>
                      <div className="text-xl font-semibold">{queueStatus.waiting}</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <div className="text-sm text-yellow-800">Active</div>
                      <div className="text-xl font-semibold">{queueStatus.active}</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <div className="text-sm text-green-800">Completed</div>
                      <div className="text-xl font-semibold">{queueStatus.completed}</div>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <div className="text-sm text-red-800">Failed</div>
                      <div className="text-xl font-semibold">{queueStatus.failed}</div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Jobs */}
                <RecentJobs 
                  jobs={recentJobs} 
                  onSelectJob={handleSelectJob} 
                  selectedJobId={selectedJobId} 
                />
              </>
            )}
          </div>
          
          {/* Statistics Panel (Right Side) */}
          <div>
            <StatsPanel
              stats={stats}
              selectedJobId={selectedJobId}
              isLoading={isLoadingStats}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </main>
    </div>
  );
}