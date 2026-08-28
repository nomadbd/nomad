import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { SendIcon } from '../icons';
import { Order } from '../../utils/messageUtils';

interface OrderStatusModalProps {
  activeModalOrder: Order;
  statusOptions: string[];
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string, cancelReason?: string) => Promise<void>;
}

const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  activeModalOrder,
  statusOptions,
  onClose,
  onStatusChange
}) => {
  const [modalSelectedStatus, setModalSelectedStatus] = useState<string>(activeModalOrder.status);
  const [cancelReasonText, setCancelReasonText] = useState<string>(activeModalOrder.return_reason || '');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const cancelTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (modalSelectedStatus === 'Cancelled' && cancelTextareaRef.current) {
      setTimeout(() => {
        cancelTextareaRef.current?.focus();
        cancelTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [modalSelectedStatus]);

  const handleConfirmCancelSubmit = async () => {
    if (!cancelReasonText.trim() || isSubmittingCancel) return;
    setIsSubmittingCancel(true);
    try {
      await onStatusChange(activeModalOrder.id, 'Cancelled', cancelReasonText.trim());
      onClose();
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        ref={modalContainerRef}
        className="animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#23212c',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '340px',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          color: '#fff',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          {statusOptions.map((opt) => {
            const isSelected = modalSelectedStatus.toLowerCase() === opt.toLowerCase();
            return (
              <div key={opt} style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  onClick={async () => {
                    if (opt === 'Cancelled') {
                      setModalSelectedStatus('Cancelled');
                    } else {
                      setModalSelectedStatus(opt);
                      onClose();
                      await onStatusChange(activeModalOrder.id, opt);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 8px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', color: '#fff' }}>
                    {opt.toUpperCase()}
                  </span>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid #a855f7' : '2px solid #555',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#a855f7', transition: 'all 0.2s ease' }} />
                    )}
                  </div>
                </div>

                {opt === 'Cancelled' && modalSelectedStatus === 'Cancelled' && (
                  <div className="filter-expand-wrapper open">
                    <div className="filter-expand-content animate-fade-in" style={{ padding: '8px 0 4px 0' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          backgroundColor: '#14131a',
                          border: '1px solid #3b3848',
                          borderRadius: '16px',
                          padding: '6px 6px 6px 14px',
                          gap: '8px'
                        }}
                      >
                        <textarea
                          ref={cancelTextareaRef}
                          rows={2}
                          autoFocus
                          placeholder="Type cancellation reason..."
                          value={cancelReasonText}
                          onChange={(e) => setCancelReasonText(e.target.value)}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '11px',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                        />
                        <button
                          type="button"
                          disabled={!cancelReasonText.trim() || isSubmittingCancel}
                          onClick={handleConfirmCancelSubmit}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: cancelReasonText.trim() ? '#FF5252' : '#2a2836',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: cancelReasonText.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          <SendIcon width="14" height="14" stroke="currentColor" strokeWidth="2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderStatusModal;
