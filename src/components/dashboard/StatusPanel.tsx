import React from 'react';
import { Stats } from '@/interfaces/interface';

interface StatsPanelProps {
  stats: Stats;
  selectedJobId: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  stats, 
  selectedJobId, 
  isLoading, 
  onRefresh 
}) => {
    // console.log(stats);
    
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg text-black font-semibold mb-4">
        {selectedJobId ? 'Job Statistics' : 'Overall Statistics'}
      </h2>
      
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading statistics...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Log Level Distribution */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <h3 className="font-medium text-purple-800">Log Levels</h3>
            <div className="text-2xl text-black font-bold">{stats.levels?.total || 0}</div>
            <div className="text-sm text-purple-600">
              Most frequent: {stats.levels?.details?.[0]?.type || 'None'}
            </div>
            {/* Show all log levels */}
            {stats.levels?.details?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-purple-700">
                <div className="font-medium mb-1">Level Distribution:</div>
                {stats.levels.details.map((level, i) => (
                  <div key={i} className="flex justify-between items-center mt-1">
                    <span className={`
                      ${level.type === 'ERROR' ? 'text-red-600 font-medium' : ''}
                      ${level.type === 'CRITICAL' ? 'text-red-800 font-medium' : ''}
                      ${level.type === 'WARN' || level.type === 'WARNING' ? 'text-yellow-600' : ''}
                      ${level.type === 'INFO' ? 'text-blue-600' : ''}
                      ${level.type === 'DEBUG' ? 'text-green-600' : ''}
                      ${level.type === 'TRACE' ? 'text-gray-600' : ''}
                    `}>
                      {level.type}:
                    </span>
                    <span>{level.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Error Stats */}
          <div className="bg-red-50 p-3 rounded-lg">
            <h3 className="font-medium text-red-800">Errors</h3>
            <div className="text-2xl text-black font-bold">{stats.errors?.total || 0}</div>
            <div className="text-sm text-red-600">
              Most common: {stats.errors?.details?.[0]?.type || 'None'}
            </div>
            {/* Added detail: Error percentage */}
            {stats.errors?.total > 0 && (
              <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-700">
                {stats.errors?.details?.map((error, i) => (
                  <div key={i} className="flex justify-between items-center mt-1">
                    <span>{error.type}:</span>
                    <span>{error.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Keyword Stats */}
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h3 className="font-medium text-yellow-800">Error Keywords</h3>
            <div className="text-2xl text-black font-bold">{stats.keywords?.total || 0}</div>
            <div className="text-sm text-yellow-600">
              Top match: {stats.keywords?.matches?.[0]?.word || 'None'}
            </div>
            {/* Show top keywords */}
            {stats.keywords?.matches?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-yellow-200 text-xs text-yellow-700">
                <div className="font-medium mb-1">Top matches:</div>
                {stats.keywords.matches.slice(0, 3).map((keyword, i) => (
                  <div key={i} className="flex justify-between items-center mt-1">
                    <span className="truncate max-w-[70%]">{keyword.word}</span>
                    <span>{keyword.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* IP Stats */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h3 className="font-medium text-blue-800">Unique IPs</h3>
            <div className="text-2xl text-black font-bold">{stats.ips?.unique || 0}</div>
            <div className="text-sm  text-blue-600">
              Top: {stats.ips?.top?.[0]?.address || 'None'}
            </div>
            {/* Added: Show more top IPs */}
            {stats.ips?.top?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700">
                <div className="font-medium  mb-1">Top IPs:</div>
                {stats.ips.top.slice(0, 3).map((ip, i) => (
                  <div key={i} className="flex justify-between items-center mt-1">
                    <span>{ip.address}</span>
                    <span>{ip.count} hit{ip.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Added: Time distribution */}
          {!selectedJobId && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="font-medium text-green-800">Processing</h3>
              <div className="text-2xl text-green-800 font-bold">
                {stats.keywords?.total > 0 ? 
                  Math.round(((stats.errors?.total || 0) / stats.keywords?.total) * 100) + '%' : 
                  '0%'
                }
              </div>
              <div className="text-sm text-green-600">
                Error rate
              </div>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className={`mt-6 w-full py-2 rounded-lg ${
          isLoading 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {isLoading ? 'Refreshing...' : 'Refresh Data'}
      </button>
    </div>
  );
};

export default StatsPanel;