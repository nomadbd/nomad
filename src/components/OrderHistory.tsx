import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface OrderItem {
  product_name: string;
  product_image: string; // এখানে সরাসরি মিডিয়া ইউআরএল স্টোর হবে
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
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
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

  // 📄 ব্রাউজার-নেটিভ প্রিমিয়াম ডিজাইন (লাইভ স্ট্যাটাস সহ ডাউনলোড ব্যবস্থা)
  const handleDownloadInvoice = (order: Order) => {
    const dateObj = new Date(order.created_at);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const date = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${date}`;
    const formattedTime = `${hours}:${minutes}`;

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryCharge = order.delivery_charge || 0;
    const vatAmount = order.vat_amount || 0;
    const grandTotal = order.total_amount;

    const currentStatus = (order.status || 'pending').toUpperCase();
    const isDelivered = currentStatus === 'DELIVERED';
    const statusColor = isDelivered ? '#000000' : '#ff0000'; 
    const totalLabel = isDelivered ? 'TOTAL PAID' : 'AMOUNT DUE';

    const itemsHtml = order.items.map((item) => {
      const detailsArray = [];
      if (item.size && item.size !== 'N/A') detailsArray.push(`SIZE: ${item.size.toUpperCase()}`);
      if (item.color && item.color !== 'N/A') detailsArray.push(`COLOR: ${item.color.toUpperCase()}`);
      detailsArray.push(`QTY: ${item.quantity}`); 

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; letter-spacing: 1px; line-height: 1.6; color: #000 !important;">
            <strong style="color: #000 !important; display: block; margin-bottom: 4px;">${item.product_name.toUpperCase()}</strong>
            <div style="color: #555; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${detailsArray.join(' &nbsp;|&nbsp; ')} &nbsp;•&nbsp; ৳${item.price}
            </div>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-family: monospace; vertical-align: bottom; color: #000 !important;">৳${item.price * item.quantity}</td>
        </tr>
      `;
    }).join('');

    const printContainer = document.createElement('div');
    printContainer.id = 'nomad-universal-print-area';

    printContainer.innerHTML = `
      <div class="header">NOMAD</div>
      <div class="sub-header">Proforma Invoice / Live Order Memorandum</div>
      
      <table class="info-table">
        <tr>
          <td style="width: 50%; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px;">
            <span style="color: #666; font-size: 9px; letter-spacing: 1.5px; font-weight: bold; display: block;">SHIPPING TO</span>
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">ORDER ID:</strong> #${order.id}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
            ${(order.customer_name || 'VALUED CUSTOMER').toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">DATE:</strong> ${formattedDate} &nbsp;&nbsp; <strong style="color: #000 !important;">TIME:</strong> ${formattedTime}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            ${order.customer_phone || 'N/A'}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">PAYMENT:</strong> CASH ON DELIVERY
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px; line-height: 1.4; max-width: 300px;">
            ${(order.shipping_address || 'N/A').toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: ${statusColor}; letter-spacing: 1px; text-transform: uppercase;">STATUS: ${currentStatus}</strong>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000 !important;">DESCRIPTION</th>
            <th style="text-align: right; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000 !important;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table class="summary-table">
        <tr><td style="color: #000 !important;">SUBTOTAL</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${subtotal}</td></tr>
        <tr><td style="color: #000 !important;">SHIPPING</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${deliveryCharge}</td></tr>
        <tr><td style="color: #000 !important;">VAT</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${vatAmount}</td></tr>
        <tr style="font-weight: bold; font-size: 13px; color: ${statusColor};">
          <td style="padding-top: 12px; border-top: 1px solid #000; letter-spacing: 1px;">${totalLabel}</td>
          <td style="text-align: right; padding-top: 12px; border-top: 1px solid #000; font-family: monospace;">৳${grandTotal}</td>
        </tr>
      </table>

      <div class="disclaimer">
        <strong>LEGAL NOTICE:</strong> This is a live computer-generated order memorandum for Cash on Delivery (COD) transactions reflecting real-time fulfillment updates. Physical products remain property of NOMAD until the full invoice amount is successfully collected by our authorized delivery agent.
      </div>
    `;

    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @media print {
        @page { margin: 0mm; }
        body { 
          background: #fff !important; 
          color: #000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body > *:not(#nomad-universal-print-area) {
          display: none !important;
        }
        #nomad-universal-print-area {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: #fff !important;
          color: #000 !important;
          padding: 50px 40px !important;
          box-sizing: border-box;
          font-family: sans-serif;
        }
        .header { text-align: center; margin-bottom: 10px; letter-spacing: 6px; font-weight: bold; font-size: 22px; color: #000 !important; }
        .sub-header { text-align: center; font-size: 10px; letter-spacing: 3px; color: #666 !important; margin-bottom: 50px; text-transform: uppercase; }
        .info-table { width: 100%; margin-bottom: 40px; font-size: 11px; letter-spacing: 0.5px; border-collapse: collapse; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        .summary-table { width: 40%; margin-left: auto; font-size: 11px; line-height: 2; letter-spacing: 0.5px; margin-bottom: 60px; page-break-inside: avoid !important; }
        .disclaimer { font-size: 9px; color: #777 !important; line-height: 1.6; text-align: center; border-top: 1px solid #eee; padding-top: 20px; letter-spacing: 0.5px; page-break-inside: avoid; }
      }
      @media screen {
        #nomad-universal-print-area { display: none !important; }
      }
    `;

    document.body.appendChild(printContainer);
    document.head.appendChild(styleSheet);

    setTimeout(() => {
      window.print();
      if (document.getElementById('nomad-universal-print-area')) {
        document.body.removeChild(printContainer);
      }
      document.head.removeChild(styleSheet);
    }, 150);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // 📸 আপডেটেড কোয়েরি: nested products টেবিলের পরিবর্তে সরাসরি order_items থেকে নাম ও ছবি রিট্রিভ করা হচ্ছে
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_amount, 
          status,
          customer_name,
          customer_phone,
          shipping_address,
          delivery_charge,
          vat_amount,
          order_items (
            quantity, 
            size, 
            color, 
            price_at_purchase,
            product_name,    -- 👈 সরাসরি আমাদের নতুন স্ন্যাপশট কলাম
            product_image   -- 👈 সরাসরি আমাদের নতুন স্ন্যাপশট কলাম
          )
        `)
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedOrders = data.map((order: any) => {
          const items = (order.order_items || []).map((item: any) => {
            return {
              product_name: item.product_name || 'NOMAD PREMIUM APPAREL',
              product_image: item.product_image || 'https://via.placeholder.com/80x100',
              size: item.size || 'N/A',
              color: item.color || 'N/A',
              quantity: item.quantity || 1,
              price: item.price_at_purchase || 0
            };
          });

          return {
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            status: order.status,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            delivery_charge: order.delivery_charge,
            vat_amount: order.vat_amount,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingRight: '25px' }}>
              <div>
                <button 
                  onClick={(e) => {
                    if (isManageMode) {
                      toggleSelectOrder(order.id);
                    } else {
                      e.stopPropagation();
                      handleDownloadInvoice(order);
                    }
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: isManageMode ? '#444' : '#fff', 
                    fontSize: '11px', 
                    fontFamily: 'monospace', 
                    letterSpacing: '1.5px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'none', 
                    textTransform: 'uppercase',
                    outline: 'none',
                    transition: 'color 0.2s ease'
                  }}
                >
                  DOWNLOAD INVOICE
                </button>
              </div>
              <div>
                {isManageMode ? (
                  <div 
                    style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '2px solid #fff' : '2px solid #555', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
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

            {/* 🛒 ডানে-বাম সুদৃশ্য ক্যারোজেল স্ক্রলিং উইথ প্রোডাক্ট ইমেজ */}
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
                    boxSizing: 'border-box',
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center'
                  }}
                >
                  <img 
                    src={item.product_image} 
                    alt={item.product_name}
                    style={{
                      width: '60px',
                      height: '75px',
                      objectFit: 'cover',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #1a1a1a'
                    }}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textTransform: 'uppercase' }}>
                      {item.product_name}
                    </h4>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        SIZE: <span style={{ color: '#fff' }}>{item.size}</span>
                      </span>
                      <span style={{ width: '3px', height: '3px', backgroundColor: '#444', borderRadius: '50%' }}></span>
                      <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        COLOR: <span style={{ color: '#fff' }}>{item.color}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
