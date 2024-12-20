import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/layout/Navigation';
import Trades from './components/Trades/Trades';
import Contacts from './components/Contacts/Contacts';
import Testing from './components/Testing/Testing';
import messageProcessorService from './services/messageProcessorService';
import './App.css';

function App() {
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

  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Trades />} />
            <Route path="/contacts" element={<Contacts />} />
            {process.env.NODE_ENV === 'development' && (
              <Route path="/testing" element={<Testing />} />
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 