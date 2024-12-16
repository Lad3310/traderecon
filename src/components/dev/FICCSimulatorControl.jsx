import React, { useState, useEffect } from 'react';
import ficcSimulator from '../../services/ficcSimulator';
import ProcessingStats from './ProcessingStats';
import messageProcessorService from '../../services/messageProcessorService';

const FICCSimulatorControl = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [failureRate, setFailureRate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messageTypes, setMessageTypes] = useState({
    mt518: 0,
    mt509: 0
  });

  useEffect(() => {
    // Subscribe to message processor status
    const checkProcessorStatus = setInterval(() => {
      setIsProcessing(messageProcessorService.isProcessing);
    }, 1000);

    return () => {
      clearInterval(checkProcessorStatus);
      if (isSimulating) {
        console.log('FICCSimulator component unmounting - stopping simulation');
        ficcSimulator.stopSimulation();
        setIsSimulating(false);
      }
    };
  }, [isSimulating]);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    ficcSimulator.startSimulation(failureRate);
  };

  const handleStopSimulation = () => {
    ficcSimulator.stopSimulation();
    setIsSimulating(false);
  };

  const handleSendSingleMessage = async (shouldFail = false) => {
    try {
      const result = await ficcSimulator.sendSimulatedMessage(shouldFail);
      
      if (!result.success) {
        setFailureCount(prev => prev + 1);
        console.log('Message sending failed:', result.reason);
      } else {
        if (result.matched) {
          setMatchCount(prev => prev + 1);
        }
        if (result.messageType) {
          setMessageTypes(prev => ({
            ...prev,
            [result.messageType.toLowerCase()]: prev[result.messageType.toLowerCase()] + 1
          }));
        }
      }
      
      // Always increment message count
      setMessageCount(prev => prev + 1);
    } catch (error) {
      setFailureCount(prev => prev + 1);
      setMessageCount(prev => prev + 1);
      console.error('Error sending message:', error);
    }
  };

  const handleReset = () => {
    setMessageCount(0);
    setMatchCount(0);
    setFailureCount(0);
  };

  return (
    <div className="simulator-control" style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem' }}>
      <h3>FICC Message Simulator</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Failure Rate (%):
          <input 
            type="number" 
            min="0" 
            max="100" 
            value={failureRate}
            onChange={(e) => setFailureRate(Number(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              width: '70px',
              fontSize: '1rem'
            }}
          />
        </label>
      </div>

      <div className="simulator-buttons" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          onClick={isSimulating ? handleStopSimulation : handleStartSimulation}
          style={{
            backgroundColor: isSimulating ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {isSimulating ? '⏹ Stop Simulation' : '▶ Start Continuous Simulation'}
        </button>
        <button 
          onClick={() => handleSendSingleMessage(false)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          ✉️ Send Valid Message
        </button>
        <button 
          onClick={() => handleSendSingleMessage(true)}
          style={{
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          ���️ Send Invalid Message
        </button>
        <button 
          onClick={handleReset}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🔄 Reset Stats
        </button>
      </div>

      <ProcessingStats 
        messageCount={messageCount}
        matchCount={matchCount}
        failureCount={failureCount}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default FICCSimulatorControl; 