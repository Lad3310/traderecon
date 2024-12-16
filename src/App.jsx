import React, { useState, useEffect } from 'react'
import Navigation from './components/Navigation/Navigation'
import TradeTable from './components/TradeTable/TradeTable'
import Contacts from './components/Contacts/Contacts'
import './styles/main.css'
import messageProcessorService from './services/messageProcessorService';
import FICCSimulatorControl from './components/dev/FICCSimulatorControl';

const App = () => {
  const [activeTab, setActiveTab] = useState('trades')

  useEffect(() => {
    // Start processing messages when app initializes
    messageProcessorService.startProcessing();

    // Clean up when component unmounts
    return () => {
      console.log('App unmounting - stopping message processor...');
      messageProcessorService.stopProcessing();
    };
  }, []);

  // Add window unload handler
  useEffect(() => {
    const handleUnload = () => {
      console.log('Window unloading - stopping message processor...');
      messageProcessorService.stopProcessing();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <div className="app">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {process.env.NODE_ENV === 'development' && (
        <FICCSimulatorControl />
      )}
      
      <main>
        {activeTab === 'trades' && (
          <div className="section">
            <h2>Trade Reconciliation Dashboard</h2>
            <TradeTable />
          </div>
        )}
        
        {activeTab === 'contacts' && (
          <div className="section">
            <h2>Contacts Management</h2>
            <Contacts />
          </div>
        )}
      </main>
    </div>
  )
}

export default App 