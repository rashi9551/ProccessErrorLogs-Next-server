import React from 'react';
import { CircleEllipsis, RefreshCw } from 'lucide-react';
import { QueueDetailsProps } from '@/interfaces/interface';


const QueueDetailsComponent: React.FC<QueueDetailsProps> = ({
  queueStats,
  isLoading,
  onRefresh
}) => {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color for job state - IMPROVED CONTRAST
  const getStatusColor = (state: string | undefined) => {
    switch (state) {
      case 'active':
        return 'bg-yellow-200 text-yellow-900';
      case 'completed':
        return 'bg-green-200 text-green-900';
      case 'failed':
        return 'bg-red-200 text-red-900';
      case 'delayed':
        return 'bg-purple-200 text-purple-900';
      default:
        return 'bg-blue-200 text-blue-900';
    }
  };

  return (
    <div className="mt-6">
      {/* Queue Stats Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Queue Status</h2>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh queue data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-700 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Cards - IMPROVED CONTRAST */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-200 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-900">Waiting</div>
            <div className="text-xl font-semibold text-blue-900">{queueStats.counts.waiting}</div>
          </div>
          <div className="bg-yellow-200 p-3 rounded-lg">
            <div className="text-sm font-medium text-yellow-900">Active</div>
            <div className="text-xl font-semibold text-yellow-900">{queueStats.counts.active}</div>
          </div>
          <div className="bg-green-200 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-900">Completed</div>
            <div className="text-xl font-semibold text-green-900">{queueStats.counts.completed}</div>
          </div>
          <div className="bg-red-200 p-3 rounded-lg">
            <div className="text-sm font-medium text-red-900">Failed</div>
            <div className="text-xl font-semibold text-red-900">{queueStats.counts.failed}</div>
          </div>
        </div>
      </div>

      {/* Priority Jobs */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Priority Queue</h2>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <CircleEllipsis className="w-8 h-8 text-gray-600 animate-pulse" />
          </div>
        ) : queueStats.priorityJobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <th className="px-3 py-2">Job ID</th>
                  <th className="px-3 py-2">File Name</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {queueStats.priorityJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-900">{job.id}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{job.data.fileName}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{formatFileSize(job.data.fileSize)}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{job.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-700 text-sm italic">No priority jobs in queue</p>
        )}
      </div>

      {/* Active Jobs */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Active Jobs</h2>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <CircleEllipsis className="w-8 h-8 text-gray-600 animate-pulse" />
          </div>
        ) : queueStats.recentJobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <th className="px-3 py-2">Job ID</th>
                  <th className="px-3 py-2">File Name</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {queueStats.recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-900">{job.id}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{job.data.fileName}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.state)}`}>
                        {job.state || 'waiting'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {job.timestamp ? formatDate(job.timestamp) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-700 text-sm italic">No active jobs</p>
        )}
      </div>
    </div>
  );
};

export default QueueDetailsComponent;