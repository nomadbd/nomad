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
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_fee?: number;
  vat?: number;
  payment_method?: string;
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

  // 📄 ২য় ছবির (1.pdf) মতো প্রিমিয়াম ইনভয়েস জেনারেটর
  const handleDownloadInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateObj = new Date(order.created_at);
    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

    // হিসাব-নিকাশ ব্রেকডাউন
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = order.shipping_fee || 0;
    const vatAmount = order.vat || 0;

    // প্রোডাক্ট লিস্ট রেন্ডার
    const itemsHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid #f2f2f2;">
        <td style="padding: 15px 0; font-size: 12px; font-family: 'Inter', sans-serif;">
          <div style="font-weight: 800; text-transform: uppercase; color: #000; letter-spacing: 0.3px;">${item.product_name}</div>
          <div style="font-size: 10px; color: #666; font-weight: 500; margin-top: 5px; letter-spacing: 0.5px;">
            SIZE: ${item.size} | COLOR: ${item.color} | QTY: ${item.quantity} × ৳${item.price}
          </div>
        </td>
        <td style="padding: 15px 0; text-align: right; font-size: 12px; font-weight: 700; color: #000; font-family: monospace;">
          ৳${item.price * item.quantity}
        </td>
      </tr>
    `).join('');

    // প্রিমিয়াম মিনিমালিস্ট পিডিএফ ডিজাইন ও ব্রাউজার হেডার হাইড স্ক্রিপ্ট
    printWindow.document.write(`
      <html>
        <head>
          <title>INVOICE_${order.id.slice(0, 8).toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
            
            /* 🚫 এই রুলটি ব্রাউজারের নিজস্ব সময়, ইউআরএল বা আইডি প্রিন্ট হওয়া বন্ধ করবে */
            @page { 
              size: A4; 
              margin: 0mm; 
            }
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: #000; 
              margin: 0; 
              padding: 60px 50px; 
              background: #fff; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            .brand-header { text-align: center; margin-bottom: 50px; }
            .brand-name { font-size: 22px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: #000; }
            .brand-subtitle { font-size: 9px; color: #555; margin-top: 6px; letter-spacing: 1.5px; font-weight: 700; text-transform: uppercase; }
            
            .metadata-container { display: flex; justify-content: space-between; font-size: 11px; line-height: 1.7; margin-bottom: 40px; }
            .shipping-box { width: 50%; }
            .shipping-title { color: #000; font-weight: 800; letter-spacing: 0.5px; font-size: 11px; }
            .shipping-name { font-size: 12px; font-weight: 700; text-transform: uppercase; display: block; margin-top: 4px; }
            .shipping-details { color: #444; }
            
            .order-box { width: 50%; text-align: right; font-family: monospace; font-size: 11px; }
            .order-label { font-family: 'Inter', sans-serif; font-weight: 700; color: #000; }
            .status-due { color: #ff3333; font-weight: 800; font-family: 'Inter', sans-serif; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
            th { border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; color: #000; }
            
            .summary-wrapper { display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 60px; }
            .summary-table { width: 240px; border-collapse: collapse; font-family: monospace; font-size: 12px; line-height: 2; }
            .summary-label { font-family: 'Inter', sans-serif; font-weight: 700; color: #555; text-align: left; }
            .summary-val { text-align: right; font-weight: 700; color: #000; }
            .total-row { border-top: 1px solid #000; font-size: 13px; }
            .total-label { font-family: 'Inter', sans-serif; font-weight: 800; color: #ff3333; padding-top: 8px; text-align: left; }
            .total-val { font-weight: 800; color: #ff3333; padding-top: 8px; text-align: right; }
            
            .legal-notice { font-size: 9px; color: #444; line-height: 1.6; text-align: justify; border-top: 1px solid #e5e5e5; padding-top: 20px; font-weight: 500; }
          </style>
        </head>
        <body>
          
          <div class="brand-header">
            <div class="brand-name">NOMAD</div>
            <div class="brand-subtitle">PROFORMA INVOICE / ORDER MEMORANDUM</div>
          </div>
          
          <div class="metadata-container">
            <div class="shipping-box">
              <span class="shipping-title">SHIPPING TO</span><br>
              <span class="shipping-name">${order.shipping_name || 'N/A'}</span>
              <div class="shipping-details">
                ${order.shipping_phone || 'N/A'}<br>
                ${order.shipping_address || 'N/A'}
              </div>
            </div>
            
            <div class="order-box">
              <span class="order-label">ORDER ID:</span> #${order.id}<br>
              <span class="order-label">DATE:</span> ${formattedDate}&nbsp;&nbsp;&nbsp;<span class="order-label">TIME:</span> ${formattedTime}<br>
              <span class="order-label">PAYMENT:</span> ${order.payment_method || 'CASH ON DELIVERY'}<br>
              <span class="order-label">STATUS:</span> <span class="status-due">${order.status === 'delivered' ? 'PAID' : 'UNPAID / DUE'}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">DESCRIPTION</th>
                <th style="text-align: right; width: 100px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-wrapper">
            <table class="summary-table">
              <tr>
                <td class="summary-label">SUBTOTAL</td>
                <td class="summary-val">৳${subtotal}</td>
              </tr>
              <tr>
                <td class="summary-label">SHIPPING</td>
                <td class="summary-val">৳${shippingFee}</td>
              </tr>
              <tr>
                <td class="summary-label" style="padding-bottom: 8px;">VAT</td>
                <td class="summary-val" style="padding-bottom: 8px;">৳${vatAmount}</td>
              </tr>
              <tr class="total-row">
                <td class="total-label">AMOUNT DUE</td>
                <td class="total-val">৳${order.total_amount}</td>
              </tr>
            </table>
          </div>

          <div class="legal-notice">
            <strong>LEGAL NOTICE:</strong> This is a computer-generated order memorandum for Cash on Delivery (COD) transactions. It does not constitute a proof of final payment, sales receipt, or legal ownership of goods. Physical products will remain property of NOMAD until the full invoice amount is successfully collected by our authorized delivery agent.
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
          shipping_name,
          shipping_phone,
          shipping_address,
          shipping_fee,
          vat,
          payment_method,
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
            shipping_name: order.shipping_name,
            shipping_phone: order.shipping_phone,
            shipping_address: order.shipping_address,
            shipping_fee: order.shipping_fee,
            vat: order.vat,
            payment_method: order.payment_method,
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
            {/* ফিক্সড হেডার: আন্ডারলাইন ছাড়া ডাউনলোড ইনভয়েস টেক্সট বাটন */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingRight: '25px' }}>
              <div>
                {isManageMode ? (
                  <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    DOWNLOAD INVOICE
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
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                  >
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
