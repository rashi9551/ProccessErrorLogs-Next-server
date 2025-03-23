'use client';

import DashboardLoader from "@/components/shimmer/dashboardLoader";
import { userLogin, userLogout } from "@/utils/redux/slices/authSlice";
import { RootState } from "@/utils/redux/store";
import { signOut } from "@/action";
import createClientForBrowser from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from 'sonner';
import { JobStatus, QueueState, Stats } from "@/interfaces/interface";
import RecentJobs from "@/components/dashboard/ReacentJob";
import StatsPanel from "@/components/dashboard/StatusPanel";
import JobDetailsTable from "@/components/dashboard/JobDetails";
import FileUploadComponent from "@/components/dashboard/FileUpload";
import QueueDetailsComponent from "@/components/dashboard/QueueDetails";
import { io, Socket } from 'socket.io-client';
import ConsoleComponent from "@/components/dashboard/Console";
import { dashboardStats, initialValueQueueStats } from "@/utils/constant";
import { shallowEqual } from 'react-redux';

export default function Dashboard() {
  const dispatch = useDispatch();
  const router = useRouter();

  const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn, shallowEqual);
  const userEmail = useSelector((state: RootState) => state.auth.email, shallowEqual);
  // State for the dashboard
  const [stats, setStats] = useState<Stats>(dashboardStats);
  const [queueStats, setQueueStats] = useState<QueueState>(initialValueQueueStats);

  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);

  const [recentJobs, setRecentJobs] = useState<JobStatus[]>(() => []);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  const supabase = createClientForBrowser();

  const [socketConnection, setSocketConnection] = useState<Socket | null>(null);
  
  useEffect(() => {
    // Establish WebSocket connection using socket.io-client
    const socket = io('http://localhost:3001', {
      transports: ['websocket'], 
    });

    socket.on('connect', () => {
      console.log('WebSocket connection established');
      setSocketConnection(socket); 
    });

    socket.on('disconnect', () => {
      console.log('WebSocket connection closed');
      setSocketConnection(null);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  
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
      fetchQueueStats(); 
      setIsLoading(false);
    }
  }, [dispatch, router, isLoggedIn,selectedJobId]);



  const fetchDashboardData = async () => {
    try {
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
      // console.log(data,"delected jobid ",selectedJobId);
      
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchQueueStats = async () => {
    setIsLoadingQueue(true);
    try {
      const response = await fetch('/api/queue-stats');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch queue statistics');
      }
  
      const data = await response.json();
      setQueueStats(data);
    } catch (error:any) {
      console.error('Error fetching queue statistics:', error);
      toast.error(error.message || 'Failed to load queue statistics');
      setQueueStats(initialValueQueueStats);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    console.log(file);
    
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
        toast.error("Authentication required.  Please login.")
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
            
      if (response.status === 429) {
        toast.error("Too many requests. Please try again later.");
        return;
      }
  
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const data = await response.json();
      const jobId = data?.jobId;
      
      if (!jobId) {
        throw new Error("Server didn't return a valid job ID");
      }
      
      toast.success(`File uploaded. Job ID: ${jobId}`);
      
      // Refresh dashboard data after upload
      setTimeout(() => {
        fetchDashboardData();
        fetchStats();
        fetchQueueStats();
      }, 7000);
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
              currentFile={file} // Pass the file state to the component
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
                <QueueDetailsComponent 
                  queueStats={queueStats}
                  isLoading={isLoadingQueue}
                  onRefresh={fetchQueueStats}
                />
                
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

      {/* Add the Console Component here */}
      <ConsoleComponent socketConnection={socketConnection} />

    </div>
  );
}