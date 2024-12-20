import React from 'react';
import MessageSimulator from '../dev/MessageSimulator';
import './Testing.css';

const Testing = () => {
  return (
    <div className="testing-dashboard">
      <h1>Testing Tools</h1>
      <MessageSimulator />
    </div>
  );
};

export default Testing; 