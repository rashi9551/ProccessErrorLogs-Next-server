import React from 'react';
import { JobDetailsTableProps } from "@/interfaces/interface";


const JobDetailsTable: React.FC<JobDetailsTableProps> = ({ 
  stats, 
  isLoadingStats, 
  selectedJobId, 
  onBackClick 
}) => {
  // Get category-specific styles and icons
  const getCategoryStyles = (category: string) => {
    switch(category) {
      case 'Errors':
        return {
          headerBg: 'bg-red-100',
          headerText: 'text-red-800',
          dotBg: 'bg-red-500',
          itemText: 'text-red-700',
          hoverBg: 'hover:bg-red-50',
          icon: (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'IP Addresses':
        return {
          headerBg: 'bg-blue-100',
          headerText: 'text-blue-800',
          dotBg: 'bg-blue-500',
          itemText: 'text-blue-700',
          hoverBg: 'hover:bg-blue-50',
          icon: (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'Keywords':
        return {
          headerBg: 'bg-amber-100',
          headerText: 'text-amber-800',
          dotBg: 'bg-amber-500',
          itemText: 'text-amber-700',
          hoverBg: 'hover:bg-amber-50',
          icon: (
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          )
        };
      case 'Log Levels':
        return {
          headerBg: 'bg-purple-100',
          headerText: 'text-purple-800',
          dotBg: 'bg-purple-500',
          itemText: 'text-purple-700',
          hoverBg: 'hover:bg-purple-50',
          icon: (
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        };
      default:
        return {
          headerBg: 'bg-gray-100',
          headerText: 'text-gray-800',
          dotBg: 'bg-gray-500',
          itemText: 'text-gray-700',
          hoverBg: 'hover:bg-gray-50',
          icon: null
        };
    }
  };

  const renderNoDataMessage = (category: string) => (
    <div className="flex items-center justify-center py-3 text-sm italic text-gray-500">
      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      No {category.toLowerCase()} data available
    </div>
  );
  
  // Function to convert snake_case to Title Case
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render a table row with its data
  const renderTableRow = (category: string, total: number, details: any[] | undefined) => {
    const styles = getCategoryStyles(category);
    const formattedCategory = formatFieldName(category);
    
    const getDetailItems = () => {
      if (!details || details.length === 0) {
        return renderNoDataMessage(category);
      }
      
      return (
        <div className="max-h-28 overflow-y-auto pr-2 custom-scrollbar">
          {details.map((item, i) => (
            <div 
              key={i} 
              className={`text-sm mb-2 ${styles.itemText} flex items-center justify-between rounded-md p-1 pl-2 ${i % 2 === 0 ? 'bg-white' : `bg-opacity-30 ${styles.headerBg}`}`}
            >
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full ${styles.dotBg} mr-2`}></span>
                <span className="font-medium">{item.type || item.word || item.address || "Unknown"}</span>
              </div>
              <span className="font-semibold bg-white bg-opacity-70 rounded-md px-2 py-0.5 text-gray-800">
                {item.count} {category === 'IP Addresses' ? 'hits' : category === 'Keywords' ? 'matches' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    };

    return (
      <tr key={category} className={`${styles.hoverBg} transition-colors duration-150 border-b`}>
        <td className={`py-4 px-4 ${styles.headerText} font-medium flex items-center`}>
          {styles.icon}
          <span className="ml-2">{formattedCategory}</span>
        </td>
        <td className="py-4 px-4 text-gray-800">
          <div className="font-semibold text-lg">{total}</div>
          {category === 'IP Addresses' && (
            <div className="text-xs text-gray-500">unique addresses</div>
          )}
        </td>
        <td className="py-4 px-4">{getDetailItems()}</td>
      </tr>
    );
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-1 h-12 bg-blue-600 rounded-full mr-3"></div>
          <div>
            <h2 className="text-xl text-gray-800 font-bold">
              Job Details
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              ID: {selectedJobId && <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{selectedJobId.slice(0, 12)}...</span>}
            </p>
          </div>
        </div>
        <button 
          onClick={onBackClick}
          className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Overview
        </button>
      </div>
      
      {/* Stats Table for Selected Job */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        {isLoadingStats ? (
          <div className="py-16 text-center bg-gray-50">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading job statistics...</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <th className="py-3 px-4 text-gray-700 text-left font-semibold">Category</th>
                <th className="py-3 px-4 text-gray-700 text-left font-semibold">Count</th>
                <th className="py-3 px-4 text-gray-700 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRow('Errors', stats.errors?.total || 0, stats.errors?.details)}
              {renderTableRow('IP Addresses', stats.ips?.unique || 0, stats.ips?.top)}
              {renderTableRow('Keywords', stats.keywords?.total || 0, stats.keywords?.matches)}
              {stats.levels && renderTableRow('Log Levels', stats.levels?.total || 0, stats.levels?.details)}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 flex items-center">
        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Scroll within each section to see more details
      </div>
    </div>
  );
};

// Add this CSS to your global styles
const GlobalStyles = () => {
  return (
    <style jsx global>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `}</style>
  );
};

export default JobDetailsTable;