import React from 'react';
import './AlertDialog.css';

const AlertDialog = ({ message, onClose, type = 'error' }) => {
  return (
    <div className="alert-dialog-overlay" onClick={onClose}>
      <div className="alert-dialog" onClick={e => e.stopPropagation()}>
        <div className={`alert-dialog-content ${type}`}>
          <div className="alert-dialog-icon">
            {type === 'error' ? '!' : 'ℹ'}
          </div>
          <div className="alert-dialog-message">
            {message}
          </div>
        </div>
        <button className="alert-dialog-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AlertDialog; 