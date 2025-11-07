import React, { createContext, useContext, useState } from 'react';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null);

  const startCall = (callData) => {
    console.log('CallContext: Starting call with data:', callData);
    
    setActiveCall(prev => {
      // If same call is being updated (e.g., minimizing/maximizing), preserve startTime
      if (prev && prev.channelName === callData.channelName) {
        console.log('CallContext: Updating existing call, preserving startTime');
        return {
          ...callData,
          startTime: prev.startTime, // Preserve original start time
          isMinimized: callData.isMinimized !== undefined ? callData.isMinimized : prev.isMinimized,
        };
      }
      
      // New call - set startTime
      console.log('CallContext: New call, setting startTime');
      return {
        ...callData,
        startTime: Date.now(),
        isMinimized: false,
      };
    });
  };

  const endCall = () => {
    console.log('CallContext: Ending call');
    setActiveCall(null);
  };

  const minimizeCall = () => {
    console.log('CallContext: Minimizing call');
    setActiveCall(prev => prev ? { ...prev, isMinimized: true } : null);
  };

  const maximizeCall = () => {
    console.log('CallContext: Maximizing call');
    setActiveCall(prev => prev ? { ...prev, isMinimized: false } : null);
  };

  return (
    <CallContext.Provider value={{ activeCall, startCall, endCall, minimizeCall, maximizeCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};

