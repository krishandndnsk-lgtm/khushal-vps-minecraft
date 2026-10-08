'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface NotificationProps {
  type?: 'error' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

export function Notification({ type = 'info', message, onClose }: NotificationProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    error: <AlertCircle className="text-red-400" />,
    success: <CheckCircle className="text-green-400" />,
    info: <Info className="text-blue-400" />,
  };

  const bgColors = {
    error: 'bg-red-500/10 border-red-500/20',
    success: 'bg-green-500/10 border-green-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg border glass ${bgColors[type]} flex items-center gap-3 max-w-md z-50`}>
      {icons[type]}
      <span className="text-sm text-gray-300 flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X size={20} />
      </button>
    </div>
  );
}
