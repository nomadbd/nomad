import React from 'react';

interface OrderSuccessViewProps {
  styles: any;
  onDownloadInvoice: () => void;
  onSuccess: () => void;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({
  styles,
  onDownloadInvoice,
  onSuccess,
}) => {
  return (
    <div style={styles.successOverlay}>
      <div style={styles.successWrapper}>
        <div style={{ fontSize: '32px', marginBottom: '15px', color: '#fff', lineHeight: 1 }}>✓</div>

        <h2 style={{ fontSize: '13px', letterSpacing: '3px', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>
          ORDER PLACED SUCCESSFULLY
        </h2>

        <p style={{ fontSize: '10px', letterSpacing: '1.2px', color: '#bbbbbb', lineHeight: '2', marginBottom: '40px', textTransform: 'uppercase' as const, padding: '0 10px' }}>
          Thank you for your purchase. Your order has been received and is currently being processed. Registered users can also track this in their profile.
        </p>

        <button onClick={onDownloadInvoice} style={styles.invoiceLink}>
          DOWNLOAD ORDER MEMO
        </button>

        <button onClick={onSuccess} style={{ ...styles.submitBtn, marginTop: '25px', maxWidth: '260px', margin: '25px auto 0 auto' }}>
          CONTINUE SHOPPING
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessView;
