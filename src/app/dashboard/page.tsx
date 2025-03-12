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

// Type definitions
interface ErrorDetail {
  type: string;
  count: number;
}

interface IpDetail {
  address: string;
  count: number;
}

interface KeywordMatch {
  word: string;
  count: number;
}

interface Stats {
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
    matches: KeywordMatch[];
  };
}

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface Job {
  id: string;
  fileName: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn);
  const userEmail = useSelector((state: RootState) => state.auth.email);
  
  // State for the dashboard
  const [stats, setStats] = useState<Stats>({ 
    errors: { total: 0, details: [] }, 
    ips: { unique: 0, top: [] }, 
    keywords: { total: 0, matches: [] } 
  });
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ waiting: 0, active: 0, completed: 0, failed: 0 });
  const [recentJobs, setRecentJobs] = useState<Job[]>(() => []);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
      setIsLoading(false);
    }
  }, [dispatch, router, isLoggedIn]);

  // Mock data fetching - would be replaced with real API calls
  useEffect(() => {
    if (isLoggedIn) {
      // Simulate API call delay
      setTimeout(() => {
        // Mock data
        setQueueStatus({
          waiting: 2,
          active: 1,
          completed: 5,
          failed: 0
        });
        
        setStats({
          errors: { 
            total: 37, 
            details: [
              { type: 'Database timeout', count: 15 },
              { type: 'Authentication failed', count: 12 },
              { type: 'API error', count: 10 }
            ] 
          },
          ips: { 
            unique: 24, 
            top: [
              { address: '192.168.1.1', count: 45 },
              { address: '10.0.0.5', count: 31 },
              { address: '172.16.254.1', count: 27 }
            ] 
          },
          keywords: { 
            total: 52, 
            matches: [
              { word: 'security', count: 18 },
              { word: 'authentication', count: 14 },
              { word: 'timeout', count: 20 }
            ] 
          }
        });
        
        setRecentJobs([
          { id: 'job123456789', fileName: 'app-logs-2025-02-15.log', status: 'completed', progress: 100 },
          { id: 'job234567890', fileName: 'server-logs-2025-02-14.log', status: 'completed', progress: 100 },
          { id: 'job345678901', fileName: 'auth-logs-2025-02-13.log', status: 'active', progress: 65 },
          { id: 'job456789012', fileName: 'api-logs-2025-02-12.log', status: 'waiting', progress: 0 }
        ]);
        
        setIsLoading(false);
      }, 2000);
    }
  }, [isLoggedIn]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
      }
  
      const response = await fetch("/api/upload-logs", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`, // Add JWT to authorization header
        },
      });
  
      if (!response.ok) {
        throw new Error("Upload failed");
      }
  
      const data = await response.json();
      console.log(data);
      const jobId = data?.jobId;
      toast.success(`File uploaded. Job ID: ${jobId}`);
      if (!jobId) {
        throw new Error("Server didn't return a valid job ID");
      }
      setRecentJobs(prev => [
        { id: jobId, fileName: file.name, status: "waiting", progress: 0 },
        ...prev,
      ]);
  
      setQueueStatus(prev => ({
        ...prev,
        waiting: prev.waiting + 1,
      }));
  
      setFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  
  
  // Simulate job progress updates
  const updateJobProgress = (jobId: string) => {
    // Start the job
    setRecentJobs(prev => 
      prev.map(job => 
        job.id === jobId ? {...job, status: 'active', progress: 5} : job
      )
    );
    
    setQueueStatus(prev => ({
      ...prev,
      waiting: prev.waiting - 1,
      active: prev.active + 1
    }));
    
    // Simulate progress updates
    let progress = 5;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Complete the job
        setRecentJobs(prev => 
          prev.map(job => 
            job.id === jobId ? {...job, status: 'completed', progress: 100} : job
          )
        );
        
        setQueueStatus(prev => ({
          ...prev,
          active: prev.active - 1,
          completed: prev.completed + 1
        }));
        
        if (selectedJobId === jobId) {
          // If this job is being viewed, update its stats
          setStats({
            errors: { 
              total: Math.floor(Math.random() * 20) + 5, 
              details: [
                { type: 'Database timeout', count: Math.floor(Math.random() * 10) + 1 },
                { type: 'Authentication failed', count: Math.floor(Math.random() * 8) + 1 },
                { type: 'API error', count: Math.floor(Math.random() * 5) + 1 }
              ] 
            },
            ips: { 
              unique: Math.floor(Math.random() * 15) + 10, 
              top: [
                { address: '192.168.1.' + Math.floor(Math.random() * 254) + 1, count: Math.floor(Math.random() * 20) + 20 },
                { address: '10.0.0.' + Math.floor(Math.random() * 254) + 1, count: Math.floor(Math.random() * 15) + 15 },
                { address: '172.16.254.' + Math.floor(Math.random() * 254) + 1, count: Math.floor(Math.random() * 10) + 10 }
              ] 
            },
            keywords: { 
              total: Math.floor(Math.random() * 30) + 20, 
              matches: [
                { word: 'security', count: Math.floor(Math.random() * 10) + 5 },
                { word: 'authentication', count: Math.floor(Math.random() * 8) + 3 },
                { word: 'timeout', count: Math.floor(Math.random() * 12) + 8 }
              ] 
            }
          });
        }
      } else {
        // Update progress
        setRecentJobs(prev => 
          prev.map(job => 
            job.id === jobId ? {...job, progress} : job
          )
        );
      }
    }, 2000);
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    
    // Find the selected job
    const job = recentJobs.find(j => j?.id === jobId);
    
    if (job && job.status === 'completed') {
      // For completed jobs, simulate fetching detailed stats
      setTimeout(() => {
        setStats({
          errors: { 
            total: Math.floor(Math.random() * 20) + 5, 
            details: [
              { type: 'Database timeout', count: Math.floor(Math.random() * 10) + 1 },
              { type: 'Authentication failed', count: Math.floor(Math.random() * 8) + 1 },
              { type: 'API error', count: Math.floor(Math.random() * 5) + 1 }
            ] 
          },
          ips: { 
            unique: Math.floor(Math.random() * 15) + 10, 
            top: [
              { address: '192.168.1.' + Math.floor(Math.random() * 254) + 1, count: Math.floor(Math.random() * 20) + 20 },
              { address: '10.0.0.' + Math.floor(Math.random() * 254) + 1, count: Math.floor(Math.random() * 15) + 15 },
              { address: '172.16.254.' + Math.floor(Math.random() * 254) + 1, count: Math.floor(Math.random() * 10) + 10 }
            ] 
          },
          keywords: { 
            total: Math.floor(Math.random() * 30) + 20, 
            matches: [
              { word: 'security', count: Math.floor(Math.random() * 10) + 5 },
              { word: 'authentication', count: Math.floor(Math.random() * 8) + 3 },
              { word: 'timeout', count: Math.floor(Math.random() * 12) + 8 }
            ] 
          }
        });
      }, 500);
    } else if (job && job.status === 'active') {
      // For active jobs, show partial stats
      setStats({
        errors: { 
          total: Math.floor(job.progress / 10), 
          details: [
            { type: 'Database timeout', count: Math.floor(job.progress / 20) },
            { type: 'Authentication failed', count: Math.floor(job.progress / 25) }
          ] 
        },
        ips: { 
          unique: Math.floor(job.progress / 5), 
          top: [
            { address: '192.168.1.1', count: Math.floor(job.progress / 3) },
            { address: '10.0.0.5', count: Math.floor(job.progress / 4) }
          ] 
        },
        keywords: { 
          total: Math.floor(job.progress / 4), 
          matches: [
            { word: 'security', count: Math.floor(job.progress / 8) },
            { word: 'timeout', count: Math.floor(job.progress / 6) }
          ] 
        }
      });
    } else {
      // For waiting jobs, show empty stats
      setStats({
        errors: { total: 0, details: [] },
        ips: { unique: 0, top: [] },
        keywords: { total: 0, matches: [] }
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    dispatch(userLogout());
    toast.success('Logged out successfully');
    router.push("/login");
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
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Upload Log File</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="file"
                  accept=".log,.txt"
                  onChange={handleFileChange}
                  className="border p-2 rounded flex-grow"
                />
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !file}
                  className={`px-4 py-2 rounded-lg text-white ${
                    isUploading || !file ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            {selectedJobId ? (
              // Job Details View
              <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Job Details: {selectedJobId.slice(0, 8)}...
                  </h2>
                  <button 
                    onClick={() => setSelectedJobId(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Back to Overview
                  </button>
                </div>
                
                {/* Stats Table for Selected Job */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Category</th>
                        <th className="py-3 px-4 text-left">Count</th>
                        <th className="py-3 px-4 text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4 border-t">Errors</td>
                        <td className="py-3 px-4 border-t">{stats.errors?.total || 0}</td>
                        <td className="py-3 px-4 border-t">
                          <div className="max-h-20 overflow-y-auto">
                            {stats.errors?.details?.map((error, i) => (
                              <div key={i} className="text-sm text-red-600">
                                {error.type}: {error.count}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-t">IP Addresses</td>
                        <td className="py-3 px-4 border-t">{stats.ips?.unique || 0} unique</td>
                        <td className="py-3 px-4 border-t">
                          <div className="max-h-20 overflow-y-auto">
                            {stats.ips?.top?.map((ip, i) => (
                              <div key={i} className="text-sm">
                                {ip.address}: {ip.count} hits
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-t">Keywords</td>
                        <td className="py-3 px-4 border-t">{stats.keywords?.total || 0}</td>
                        <td className="py-3 px-4 border-t">
                          <div className="max-h-20 overflow-y-auto">
                            {stats.keywords?.matches?.map((keyword, i) => (
                              <div key={i} className="text-sm">
                                {keyword.word}: {keyword.count} matches
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
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
                <div className="bg-white p-4 rounded-lg shadow-md mt-6">
                  <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
                  {recentJobs.length === 0 ? (
                    <p className="text-gray-500">No recent jobs found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2 px-4 text-left">Job ID</th>
                            <th className="py-2 px-4 text-left">File</th>
                            <th className="py-2 px-4 text-left">Status</th>
                            <th className="py-2 px-4 text-left">Progress</th>
                            <th className="py-2 px-4 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentJobs&&recentJobs.map((job) => (
                            <tr key={job.id}>
                              <td className="py-2 px-4 border-t">  {job?.id ? job.id.slice(0, 8) + '...' : 'N/A'}
                              </td>
                              <td className="py-2 px-4 border-t">{job.fileName}</td>
                              <td className="py-2 px-4 border-t">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  job.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {job.status}
                                </span>
                              </td>
                              <td className="py-2 px-4 border-t">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${job.progress || 0}%` }}
                                  ></div>
                                </div>
                              </td>
                              <td className="py-2 px-4 border-t">
                                <button
                                  onClick={() => handleSelectJob(job.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Statistics Panel (Right Side) */}
          <div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">
                {selectedJobId ? 'Job Statistics' : 'Overall Statistics'}
              </h2>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <h3 className="font-medium text-red-800">Errors</h3>
                  <div className="text-2xl font-bold">{stats.errors?.total || 0}</div>
                  <div className="text-sm text-red-600">
                    Most common: {stats.errors?.details?.[0]?.type || 'None'}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="font-medium text-blue-800">Unique IPs</h3>
                  <div className="text-2xl font-bold">{stats.ips?.unique || 0}</div>
                  <div className="text-sm text-blue-600">
                    Top: {stats.ips?.top?.[0]?.address || 'None'}
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h3 className="font-medium text-yellow-800">Keywords</h3>
                  <div className="text-2xl font-bold">{stats.keywords?.total || 0}</div>
                  <div className="text-sm text-yellow-600">
                    Top match: {stats.keywords?.matches?.[0]?.word || 'None'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  toast.info("Refreshing data...");
                  setTimeout(() => {
                    toast.success("Data refreshed");
                  }, 800);
                }}
                className="mt-6 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}