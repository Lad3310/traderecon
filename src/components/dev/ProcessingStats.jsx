import React from 'react';
import { useEffect, useState } from 'react';

const ProcessingStats = ({ messageCount, matchCount, failureCount, isProcessing }) => {
  const [successRate, setSuccessRate] = useState(0);
  const [messageTypes, setMessageTypes] = useState({
    mt518: 0,
    mt509: 0
  });

  useEffect(() => {
    if (messageCount > 0) {
      const successCount = messageCount - failureCount;
      const rate = (successCount / messageCount) * 100;
      setSuccessRate(Math.max(0, Math.min(100, rate.toFixed(1))));
    } else {
      setSuccessRate(0);
    }
  }, [messageCount, failureCount]);

  return (
    <div className="processing-stats" style={{
      padding: '1rem',
      marginTop: '1rem',
      border: '1px solid #ccc',
      borderRadius: '4px',
      backgroundColor: '#f8f9fa'
    }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Processing Statistics</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="stat-item">
          <label>Status:</label>
          <span style={{ 
            color: isProcessing ? '#28a745' : '#dc3545',
            marginLeft: '0.5rem',
            fontWeight: 'bold'
          }}>
            {isProcessing ? '🟢 Processing' : '🔴 Stopped'}
          </span>
        </div>

        <div className="stat-item">
          <label>Messages Processed:</label>
          <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>{messageCount}</span>
        </div>

        <div className="stat-item">
          <label>Success Rate:</label>
          <span style={{ 
            marginLeft: '0.5rem', 
            fontWeight: 'bold',
            color: successRate >= 80 ? '#28a745' : successRate >= 50 ? '#ffc107' : '#dc3545'
          }}>
            {successRate}%
          </span>
        </div>

        <div className="stat-item">
          <label>MT518 Messages:</label>
          <span style={{ marginLeft: '0.5rem', fontWeight: 'bold', color: '#28a745' }}>
            {messageTypes.mt518}
          </span>
        </div>

        <div className="stat-item">
          <label>MT509 Messages:</label>
          <span style={{ marginLeft: '0.5rem', fontWeight: 'bold', color: '#007bff' }}>
            {messageTypes.mt509}
          </span>
        </div>

        <div className="stat-item">
          <label>Matches Found:</label>
          <span style={{ 
            marginLeft: '0.5rem', 
            fontWeight: 'bold',
            color: matchCount > 0 ? '#28a745' : '#6c757d'
          }}>
            {matchCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStats; 