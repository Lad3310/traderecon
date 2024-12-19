import React, { useState } from 'react';
import fixService from '../../services/fix/fixService';

const FixTester = () => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleTestMessage = async () => {
        try {
            setError(null);
            const testMessage = fixService.createTestMessage();
            const result = await fixService.handleFixMessage(testMessage);
            setResult(result);
            console.log('Test message processed:', result);
        } catch (err) {
            setError(err.message);
            console.error('Error processing test message:', err);
        }
    };

    return (
        <div style={{ 
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            margin: '20px'
        }}>
            <h3 style={{ 
                color: '#333',
                marginBottom: '20px'
            }}>FIX Message Tester</h3>
            
            <button 
                onClick={handleTestMessage}
                style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
                Send Test FIX Message
            </button>
            
            {error && (
                <div style={{ 
                    color: '#d32f2f',
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#ffebee',
                    borderRadius: '4px'
                }}>
                    Error: {error}
                </div>
            )}
            
            {result && (
                <div style={{ 
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ color: '#333', marginBottom: '10px' }}>Processed Trade:</h4>
                    <pre style={{ 
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default FixTester; 