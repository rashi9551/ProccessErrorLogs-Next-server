'use client';

import { ConsoleComponentProps, ConsoleMessage } from '@/interfaces/interface';
import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';



type ConsolePosition = 'floating' | 'hidden';

const ConsoleComponent: React.FC<ConsoleComponentProps> = ({ socketConnection }) => {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [position, setPosition] = useState<ConsolePosition>('floating');
  const [newMessageIndicator, setNewMessageIndicator] = useState<boolean>(false);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!socketConnection) return;
    
    const handleConsoleMessage = (data: { message: string; type?: 'error' | 'warning' | 'success' | 'info' }) => {
      // Remove the console.log to avoid double logging
      setMessages(prev => [...prev, {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        message: data.message,
        type: data.type || 'info'
      }]);
      
      // Show indicator if console is hidden
      if (position === 'hidden') {
        setNewMessageIndicator(true);
      }
    };
    
    // Add event listener for console messages
    socketConnection.on('consoleMessage', handleConsoleMessage);
    
    // Clean up on unmount
    return () => {
      socketConnection.off('consoleMessage', handleConsoleMessage);
    };
  }, [socketConnection, position]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (consoleEndRef.current && position !== 'hidden') {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, position]);
  
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

  const toggleVisibility = () => {
    if (position === 'hidden') {
      setPosition('floating');
      setNewMessageIndicator(false);
    } else {
      setPosition('hidden');
    }
  };

  // If hidden, just show a small button to bring it back
  if (position === 'hidden') {
    return (
      <button 
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 z-50 flex items-center justify-center"
        title="Show Console"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {newMessageIndicator && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            !
          </span>
        )}
      </button>
    );
  }

  // Floating console component
  return (
    <div className="fixed bottom-0 right-0 w-full md:w-96 z-40 shadow-lg m-4">
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center">
          <div className="flex space-x-1 mr-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h3 className="font-semibold">Console Output</h3>
          {messages.length > 0 && (
            <div className="ml-3 bg-gray-700 text-xs px-2 py-1 rounded-full">
              {messages.length}
            </div>
          )}
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
          <button 
            onClick={toggleVisibility}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Hide
          </button>
        </div>
      </div>
      
      <div 
        className={`bg-gray-900 text-white font-mono text-sm overflow-y-auto transition-height duration-300 ease-in-out rounded-b-lg ${
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