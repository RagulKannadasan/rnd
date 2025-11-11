import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }) => {
  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className="confirm-content">
          <div className="confirm-icon">⚠️</div>
          <h2>Confirm Action</h2>
          <p>{message}</p>
          <div className="confirm-actions">
            <button className="confirm-btn cancel" onClick={onCancel}>
              {cancelText}
            </button>
            <button className="confirm-btn confirm" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
          <button className="confirm-close" onClick={onCancel}>
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;