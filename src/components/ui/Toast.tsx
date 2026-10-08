import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export default function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const borderColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#121215',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        borderLeft: `4px solid ${borderColor}`,
        borderTop: '1px solid #27272a',
        borderRight: '1px solid #27272a',
        borderBottom: '1px solid #27272a',
        zIndex: 9999,
        fontSize: '13px',
        fontWeight: '500',
        fontFamily: 'monospace',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '90%',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{message}</span>
    </div>
  );
}
