import React, { useState, useEffect } from 'react'
import Navigation from './components/Navigation/Navigation'
import TradeTable from './components/TradeTable/TradeTable'
import Contacts from './components/Contacts/Contacts'
import './styles/main.css'
import messageProcessorService from './services/messageProcessorService';
import FICCSimulatorControl from './components/dev/FICCSimulatorControl';
import FixTester from './components/dev/FixTester';

const App = () => {
  const [activeTab, setActiveTab] = useState('trades')

  useEffect(() => {
    messageProcessorService.startProcessing();
    return () => {
      console.log('App unmounting - stopping message processor...');
      messageProcessorService.stopProcessing();
    };
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      console.log('Window unloading - stopping message processor...');
      messageProcessorService.stopProcessing();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'trades':
        return (
          <div className="section">
            <TradeTable />
          </div>
        );
      case 'contacts':
        return (
          <div className="section">
            <Contacts />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {process.env.NODE_ENV === 'development' && (
        <>
          <FICCSimulatorControl />
          <FixTester />
        </>
      )}
      
      <main>
        {renderContent()}
      </main>
    </div>
  )
}

export default App 