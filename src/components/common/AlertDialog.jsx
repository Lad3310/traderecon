import React from 'react';
import './AlertDialog.css';
import { FaCheck, FaTimes, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

const AlertDialog = ({ 
  show, 
  title, 
  message, 
  type = 'success', 
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText
}) => {
  if (!show) return null;

  const icons = {
    success: <FaCheck className="alert-icon success" />,
    error: <FaTimes className="alert-icon error" />,
    warning: <FaExclamationTriangle className="alert-icon warning" />,
    delete: <FaTrash className="alert-icon delete" />
  };

  const buttonText = type === 'delete' ? 'Cancel' : 'Close';

  return (
    <div className="alert-dialog-overlay" onClick={onCancel}>
      <div className="alert-dialog" onClick={e => e.stopPropagation()}>
        <div className={`alert-header ${type}`}>
          {icons[type]}
          <h3>{title}</h3>
        </div>
        <div className="alert-content">
          <p>{message}</p>
        </div>
        <div className="alert-actions">
          {onCancel && (
            <button className="cancel-btn" onClick={onCancel}>
              {cancelText || buttonText}
            </button>
          )}
          {onConfirm && (
            <button className={`confirm-btn ${type}`} onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDialog; 