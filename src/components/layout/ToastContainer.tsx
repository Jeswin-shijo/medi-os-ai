import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = '#10b981';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = '#ef4444';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = '#f59e0b';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = '#3b82f6';
        }

        return (
          <div key={toast.id} className="toast-item">
            <Icon size={18} color={iconColor} />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
