'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface ConsoleMessage {
  id: number;
  timestamp: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

interface ConsoleComponentProps {
  socketConnection: Socket | null;
}

const ConsoleComponent: React.FC<ConsoleComponentProps> = ({ socketConnection }) => {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!socketConnection) return;
    
    const handleConsoleMessage = (data: { message: string; type?: 'error' | 'warning' | 'success' | 'info' }) => {
        console.log(data.message)
      setMessages(prev => [...prev, {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        message: data.message,
        type: data.type || 'info'
      }]);
    };
    
    // Add event listener for console messages
    socketConnection.on('consoleMessage', handleConsoleMessage);
    
    // Clean up on unmount
    return () => {
      socketConnection.off('consoleMessage', handleConsoleMessage);
    };
  }, [socketConnection]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const clearConsole = (): void => {
    setMessages([]);
  };
  
  const getMessageClass = (type: string): string => {
    switch(type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-1 mr-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h3 className="font-semibold">Console Output</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={clearConsole}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          >
            {isExpanded ? 'Minimize' : 'Maximize'}
          </button>
        </div>
      </div>
      
      <div 
        className={`bg-gray-900 text-white font-mono text-sm overflow-y-auto transition-height duration-300 ease-in-out ${
          isExpanded ? 'h-96' : 'h-48'
        }`}
      >
        {messages.length === 0 ? (
          <div className="p-4 text-gray-400 italic">No messages yet. Waiting for console output...</div>
        ) : (
          <div className="p-4">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-1">
                <span className="text-gray-500">[{msg.timestamp}]</span>{' '}
                <span className={getMessageClass(msg.type)}>{msg.message}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsoleComponent;