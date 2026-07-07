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
            price,
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
            price: item.price || 0
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
          <div key={i} style={{ backgroundColor: '#050505', border: '1px solid #1c1c1c', padding: '25px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="skeleton-pulse" style={{ width: '60%', height: '16px', backgroundColor: '#1c1c1c' }} />
              <div className="skeleton-pulse" style={{ width: '12px', height: '12px', backgroundColor: '#1c1c1c' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton-pulse" style={{ width: '70px', height: '15px', backgroundColor: '#1c1c1c' }} />
              <div className="skeleton-pulse" style={{ width: '90px', height: '12px', backgroundColor: '#1c1c1c' }} />
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
        const hasMultipleItems = order.items.length > 1;

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
            {/* অ্যাকশন বাটন */}
            <div style={{ position: 'absolute', top: '22px', right: '22px', zIndex: 10 }}>
              {isManageMode ? (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '2px solid #fff' : '2px solid #888', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected && <span style={{ color: '#000', fontSize: '12px', fontWeight: '900' }}>✓</span>}
                </div>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSingleOrderToHide(order.id);
                    setModalType('single');
                  }}
                  style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* 🏎️ সুরক্ষিত হরিজোন্টাল প্রোডাক্ট কারোসেল */}
            <div 
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
                    // 🌟 ফিক্সড কোড: কম্পোনেন্ট কলাপ্স হওয়া রোধ করতে flex-shrink এবং হার্ডকোর minWidth ডিফাইন করা হয়েছে
                    flex: '0 0 auto',
                    width: hasMultipleItems ? '82%' : '100%',
                    minWidth: hasMultipleItems ? '82%' : '100%',
                    borderRight: hasMultipleItems && index !== order.items.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    paddingRight: hasMultipleItems && index !== order.items.length - 1 ? '20px' : '0',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* প্রোডাক্টের নাম */}
                  <div style={{ paddingRight: '35px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textTransform: 'uppercase' }}>
                      {item.product_name}
                    </h4>
                  </div>

                  {/* একক তথ্য ও প্রাইস */}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        SIZE: <span style={{ color: '#fff' }}>{item.size}</span>
                      </span>
                      <span style={{ width: '3px', height: '3px', backgroundColor: '#444', borderRadius: '50%' }}></span>
                      <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        COLOR: <span style={{ color: '#fff' }}>{item.color}</span>
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '2px' }}>
                      {item.quantity}x — ৳{item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 🔒 পারমানেন্ট স্ক্রল-বিহীন সেকশন (টোটাল প্রাইস এবং ডেট) */}
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

            {/* ট্র্যাকিং স্টেপার */}
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
          <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #1c1c1c', padding: '30px', textAlign: 'center' }}>
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
