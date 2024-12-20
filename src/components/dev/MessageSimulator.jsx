import React from 'react';
import FICCSimulatorControl from './FICCSimulatorControl';
import FixTester from './FixTester';
import './MessageSimulator.css';

const MessageSimulator = () => {
  return (
    <div className="message-simulator-container">
      <FICCSimulatorControl />
      <FixTester />
    </div>
  );
};

export default MessageSimulator; 