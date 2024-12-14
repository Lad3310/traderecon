import React from 'react';
import './AlertModal.css';

const AlertModal = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={e => e.stopPropagation()}>
        <div className={`alert-content ${type}`}>
          <div style={{ fontSize: '2rem' }}>{getIcon()}</div>
          <p>{message}</p>
          <button onClick={onClose} className="close-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal; 