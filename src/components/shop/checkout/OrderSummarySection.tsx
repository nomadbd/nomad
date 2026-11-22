import React from 'react';
import { CartItem } from './checkoutTypes';

interface OrderSummarySectionProps {
  styles: any;
  selectedItems: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
}

const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  styles,
  selectedItems,
  subtotal,
  deliveryCharge,
  vatRate,
  vatAmount,
  grandTotal,
}) => {
  return (
    <div style={styles.rightColumn}>
      <h2 style={{ ...styles.sectionHeading, borderBottom: '1px solid #262626', paddingBottom: '12px' }}>ORDER SUMMARY</h2>
      <div>
        {selectedItems.map((item: CartItem) => (
          <div key={item.id} style={styles.productRow}>
            <img src={item.image_url || 'https://via.placeholder.com/65x80'} alt={item.name} style={styles.productImg} />
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px', letterSpacing: '0.5px', fontWeight: 500, color: '#fff', wordBreak: 'break-word' }}>{item.name}</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cccccc', whiteSpace: 'nowrap' }}>৳{item.price * item.quantity}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#bbbbbb', letterSpacing: '0.4px' }}>
                QTY: {item.quantity} {item.color && ` • ${item.color}`} {item.size && ` / ${item.size}`}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', color: '#bbbbbb' }}><span>SUBTOTAL</span><span style={{ fontFamily: 'monospace', color: '#cccccc' }}>৳{subtotal}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', color: '#bbbbbb' }}><span>SHIPPING</span><span style={{ fontFamily: 'monospace', color: deliveryCharge === 0 ? '#fff' : '#cccccc' }}>{deliveryCharge === 0 ? 'COMPLIMENTARY' : `৳${deliveryCharge}`}</span></div>
        {vatRate > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', color: '#bbbbbb' }}><span>VAT ({vatRate}%)</span><span style={{ fontFamily: 'monospace', color: '#cccccc' }}>৳{vatAmount}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', letterSpacing: '1.5px', paddingTop: '16px', borderTop: '1px dotted #333333', color: '#fff', fontWeight: 600, marginTop: '18px' }}><span>TOTAL</span><span style={{ fontFamily: 'monospace', fontSize: '14px' }}>৳{grandTotal}</span></div>
      </div>
    </div>
  );
};

export default OrderSummarySection;
