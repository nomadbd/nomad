import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface OrderItem {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: OrderItem[]; 
}

interface OrderHistoryProps {
  userId: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [modalType, setModalType] = useState<'single' | 'bulk' | null>(null);
  const [singleOrderToHide, setSingleOrderToHide] = useState<string | null>(null);
  const [isHiding, setIsHiding] = useState<boolean>(false);

  const statusSteps = ['pending', 'received', 'shipped', 'delivered'];

  // 📄 ডাইনামিক ইনভয়েস জেনারেটর এবং ডাউনলোড ফাংশন
  const handleDownloadInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateObj = new Date(order.created_at);
    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // ইনভয়েসের ভেতরের প্রোডাক্ট লিস্ট তৈরি
    const itemsHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 14px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #000;">
          ${item.product_name}
          <br>
          <span style="font-size: 10px; color: #666; font-weight: 400; letter-spacing: 0.5px;">SIZE: ${item.size} | COLOR: ${item.color}</span>
        </td>
        <td style="padding: 14px 0; text-align: center; font-size: 13px; color: #000;">${item.quantity}</td>
        <td style="padding: 14px 0; text-align: right; font-size: 13px; font-weight: 700; color: #000;">৳${item.price}</td>
      </tr>
    `).join('');

    // ইনভয়েসের প্রিমিয়াম মিনিমালিস্ট ডিজাইন ও প্রিন্ট স্ক্রিপ্ট
    printWindow.document.write(`
      <html>
        <head>
          <title>INVOICE_#${order.id.slice(0, 8).toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #000; margin: 40px; padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .brand { font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
            .invoice-title { font-size: 26px; font-weight: 800; letter-spacing: 1px; text-align: right; }
            .details-container { margin-top: 35px; display: flex; justify-content: space-between; font-size: 12px; line-height: 1.6; }
            .status-badge { display: inline-block; padding: 5px 10px; background: #000; color: #fff; font-weight: 800; text-transform: uppercase; margin-top: 6px; font-size: 10px; letter-spacing: 1.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th { border-bottom: 2px solid #000; padding-bottom: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000; }
            .total-section { margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
            .total-label { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
            .total-amount { font-size: 24px; font-weight: 800; }
            .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #777; letter-spacing: 1px; line-height: 1.5; text-transform: uppercase; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">NOMAD PREMIUM APPAREL</div>
              <div style="font-size: 11px; color: #555; margin-top: 5px; letter-spacing: 0.5px; font-weight: 500;">MEMORANDUM OF TRANSACTION</div>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div style="font-size: 11px; color: #555; text-align: right; font-family: monospace; margin-top: 5px;">#${order.id.toUpperCase()}</div>
            </div>
          </div>
          
          <div class="details-container">
            <div>
              <span style="color: #666; font-weight: 700;">DATE OF ISSUE:</span><br>
              <span style="font-size: 13px; font-weight: 700;">${formattedDate}</span>
            </div>
            <div style="text-align: right;">
              <span style="color: #666; font-weight: 700;">FULFILLMENT STATUS:</span><br>
              <div class="status-badge">${order.status}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">ITEM DESCRIPTION</th>
                <th style="text-align: center; width: 80px;">QTY</th>
                <th style="text-align: right; width: 120px;">PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-label">TOTAL AMOUNT</div>
            <div class="total-amount">৳${order.total_amount}</div>
          </div>

          <div class="footer">
            THANK YOU FOR SHOPPING WITH NOMAD<br>
            THIS IS A SYSTEM GENERATED ELECTRONIC INVOICE. NO PHYSICAL SIGNATURE REQUIRED.
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_amount, 
          status,
          order_items (
            quantity, 
            size, 
            color, 
            price_at_purchase,
            products (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedOrders = data.map((order: any) => {
          const items = (order.order_items || []).map((item: any) => ({
            product_name: item.products?.name || 'NOMAD PREMIUM APPAREL',
            size: item.size || 'N/A',
            color: item.color || 'N/A',
            quantity: item.quantity || 1,
            price: item.price_at_purchase || 0
          }));

          return {
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            status: order.status,
            items: items
          };
        });
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  const executeHideOrders = async (idsToHide: string[]) => {
    try {
      setIsHiding(true);
      const { error } = await supabase
        .from('orders')
        .update({ is_hidden: true })
        .in('id', idsToHide);

      if (!error) {
        setOrders(orders.filter(order => !idsToHide.includes(order.id)));
        setSelectedOrderIds([]);
        setIsManageMode(false);
        setModalType(null);
        setSingleOrderToHide(null);
      }
    } catch (err) {
      console.error('Error hiding orders:', err);
    } finally {
      setIsHiding(false);
    }
  };

  const toggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(item => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ backgroundColor: '#050505', border: '1px solid #222', padding: '25px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="skeleton-pulse" style={{ width: '60%', height: '16px', backgroundColor: '#222' }} />
              <div className="skeleton-pulse" style={{ width: '12px', height: '12px', backgroundColor: '#222' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton-pulse" style={{ width: '70px', height: '15px', backgroundColor: '#222' }} />
              <div className="skeleton-pulse" style={{ width: '90px', height: '12px', backgroundColor: '#222' }} />
            </div>
          </div>
        ))}
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
          .skeleton-pulse { animation: pulse 1.5s infinite ease-in-out; }
        `}</style>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: '#fff', padding: '40px 0', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace', fontWeight: 'bold' }}>
        NO ORDER MEMORANDUM FOUND
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px', position: 'relative' }}>
      
      <style>{`
        .premium-carousel::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>ORDER HISTORY</span>
        <button 
          onClick={() => {
            setIsManageMode(!isManageMode);
            setSelectedOrderIds([]);
          }}
          style={{ background: 'none', border: 'none', color: isManageMode ? '#ff4444' : '#fff', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', fontFamily: 'monospace', outline: 'none', textTransform: 'uppercase', fontWeight: 'bold', transition: 'color 0.2s ease' }}
        >
          {isManageMode ? 'CANCEL' : 'MANAGE'}
        </button>
      </div>

      {orders.map((order) => {
        const dateObj = new Date(order.created_at);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        const isSelected = selectedOrderIds.includes(order.id);
        const hasMultipleItems = order.items && order.items.length > 1;

        return (
          <div 
            key={order.id} 
            onClick={() => {
              if (isManageMode) {
                toggleSelectOrder(order.id);
              }
            }}
            style={{ 
              backgroundColor: '#050505', 
              border: isSelected ? '1px solid #fff' : '1px solid #222', 
              padding: '25px 0px 25px 25px', 
              position: 'relative',
              opacity: isManageMode && !isSelected ? 0.5 : 1,
              cursor: isManageMode ? 'pointer' : 'default',
              userSelect: isManageMode ? 'none' : 'auto',
              transition: 'all 0.2s ease',
              overflow: 'hidden'
            }}
          >
            {/* 🛠️ ফিক্সড হেডার: অর্ডার আইডির পরিবর্তে ইনভয়েস ডাউনলোড বাটন ম্যাপ করা হলো */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingRight: '25px' }}>
              <div>
                {isManageMode ? (
                  <span style={{ fontSize: '9px', color: '#555', fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 'bold' }}>
                    ID: #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadInvoice(order);
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#fff', 
                      fontSize: '10px', 
                      fontFamily: 'monospace', 
                      letterSpacing: '1px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'underline',
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    DOWNLOAD INVOICE
                  </button>
                )}
              </div>
              <div>
                {isManageMode ? (
                  <div 
                    style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '2px solid #fff' : '2px solid #555', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', strokeWidth: '3px', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  >
                    {isSelected && <span style={{ color: '#000', fontSize: '11px', fontWeight: '900' }}>✓</span>}
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSingleOrderToHide(order.id);
                      setModalType('single');
                    }}
                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none', transition: 'color 0.2s ease' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* হরিজোন্টাল প্রোডাক্ট কারোসেল */}
            <div 
              className="premium-carousel"
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                overflowX: 'auto', 
                gap: '20px', 
                marginBottom: '25px',
                paddingRight: '25px', 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {order.items.map((item, index) => (
                <div 
                  key={index} 
                  style={{ 
                    flex: '0 0 auto',
                    width: hasMultipleItems ? '82%' : '100%',
                    minWidth: hasMultipleItems ? '82%' : '100%',
                    borderRight: hasMultipleItems && index !== order.items.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    paddingRight: hasMultipleItems && index !== order.items.length - 1 ? '20px' : '0',
                    boxSizing: 'border-box'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textTransform: 'uppercase' }}>
                      {item.product_name}
                    </h4>
                  </div>

                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      SIZE: <span style={{ color: '#fff' }}>{item.size}</span>
                    </span>
                    <span style={{ width: '3px', height: '3px', backgroundColor: '#444', borderRadius: '50%' }}></span>
                    <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      COLOR: <span style={{ color: '#fff' }}>{item.color}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* মোট অর্ডারের দাম এবং তারিখ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px', paddingRight: '25px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL AMOUNT</span>
                <span style={{ fontSize: '18px', color: '#fff', fontWeight: '800', fontFamily: 'monospace' }}>
                  ৳{order.total_amount}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', fontWeight: 'bold' }}>ISSUED DATE</span>
                <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* স্টেপার সেকশন */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '20px', paddingRight: '25px' }}>
              {statusSteps.map((step, idx) => {
                const currentStatusLower = order.status ? order.status.toLowerCase() : 'pending';
                const currentStepIndex = statusSteps.indexOf(currentStatusLower);

                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#fff' : 'transparent',
                      border: isCompleted ? '2px solid #fff' : '2px solid #444',
                      boxShadow: isCurrent ? '0 0 10px rgba(255,255,255,0.6)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}>
                      {isCompleted && (
                        <span style={{ color: '#000', fontSize: '9px', fontWeight: '900', lineHeight: 1 }}>✓</span>
                      )}
                    </div>
                    <span style={{ fontSize: '9px', letterSpacing: '0.5px', marginTop: '10px', color: isCompleted ? '#fff' : '#888', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}

      {/* ভাসমান অ্যাকশন বার */}
      {isManageMode && selectedOrderIds.length > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', maxWidth: '460px', width: 'calc(100% - 40px)', backgroundColor: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
            {selectedOrderIds.length} SELECTED
          </span>
          <button onClick={() => setModalType('bulk')} style={{ background: 'none', border: 'none', color: '#ff3333', fontWeight: 'bolder', fontSize: '12px', letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'monospace' }}>
            HIDE FROM VIEW
          </button>
        </div>
      )}

      {/* ওভারলে মোডাল */}
      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '30px', textAlign: 'center' }}>
            <h4 style={{ color: '#fff', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px', fontFamily: 'monospace', fontWeight: 'bold' }}>
              REMOVE FROM DASHBOARD?
            </h4>
            <p style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.6', letterSpacing: '0.5px', marginBottom: '25px', textAlign: 'justify', fontFamily: 'monospace' }}>
              THIS ACTION WILL HIDE THE SELECTED ITEM(S) FROM YOUR ACTIVE PROFILE VIEW. FOR REGULATORY COMPLIANCE, TAX AUDITS, AND CONSUMER PROTECTION LAWS, INTANGIBLE TRANSACTION LOGS ARE SECURELY IMMUTABLE WITHIN OUR CENTRAL ARCHIVED LEDGER.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button disabled={isHiding} onClick={() => setModalType(null)} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#fff', border: '1px solid #444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
                CANCEL
              </button>
              <button disabled={isHiding} onClick={() => { const targets = modalType === 'single' && singleOrderToHide ? [singleOrderToHide] : selectedOrderIds; executeHideOrders(targets); }} style={{ flex: 1, padding: '12px', backgroundColor: '#fff', color: '#000', border: '1px solid #fff', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {isHiding ? 'PROCESSING...' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderHistory;
