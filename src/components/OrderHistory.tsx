import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  product_name?: string; // ডাটাবেজ রিলেশন থেকে ম্যাপ হয়ে আসবে
}

interface OrderHistoryProps {
  userId: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 🛠️ ম্যানেজ মোড ও মাল্টি-সিলেক্ট স্টেট
  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // মোডাল টাইপ ট্র্যাকিং ('single' | 'bulk' | null)
  const [modalType, setModalType] = useState<'single' | 'bulk' | null>(null);
  const [singleOrderToHide, setSingleOrderToHide] = useState<string | null>(null);
  const [isHiding, setIsHiding] = useState<boolean>(false);

  const statusSteps = ['pending', 'received', 'shipped', 'delivered'];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // 🔥 orders -> order_items -> products (name) রিলেশনশিপ কুয়েরি
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_amount, 
          status,
          order_items (
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
        // রিলেশনাল ডেটা থেকে প্রোডাক্টের নাম বের করে সুন্দরভাবে ম্যাপ করা হচ্ছে
        const formattedOrders = data.map((order: any) => {
          const fetchedName = order.order_items?.[0]?.products?.name;
          return {
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            status: order.status,
            product_name: fetchedName || 'NOMAD PREMIUM APPAREL' // নাম না পাওয়া গেলে ব্যাকআপ নাম
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

  // 🛡️ অর্ডার হাইড করার কোর মেকানিজম
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

  // 💀 ১-১ মিল থাকা জিরো-ঝাকুনি স্কেলিটন লোডার (ভুল height কোডটি ঠিক করা হয়েছে)
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="skeleton-pulse" style={{ width: '60%', height: '16px', backgroundColor: '#111' }} />
              <div className="skeleton-pulse" style={{ width: '12px', height: '12px', backgroundColor: '#111' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton-pulse" style={{ width: '70px', height: '15px', backgroundColor: '#111' }} />
              <div className="skeleton-pulse" style={{ width: '90px', height: '12px', backgroundColor: '#111' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              {[1, 2, 3, 4].map((dot) => (
                <div key={dot} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div className="skeleton-pulse" style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#111' }} />
                  <div className="skeleton-pulse" style={{ width: '45px', height: '8px', backgroundColor: '#111' }} />
                </div>
              ))}
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
      <p style={{ textAlign: 'center', color: '#444', padding: '40px 0', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace' }}>
        NO ORDER MEMORANDUM FOUND
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px', position: 'relative' }}>

      {/* 🛠️ টপ হেডার কন্ট্রোল (MANAGE বাটন) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '10px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#444', fontFamily: 'monospace' }}>ORDER HISTORY</span>
        <button 
          onClick={() => {
            setIsManageMode(!isManageMode);
            setSelectedOrderIds([]);
          }}
          style={{ background: 'none', border: 'none', color: isManageMode ? '#fff' : '#555', fontSize: '10px', letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'monospace', outline: 'none', textTransform: 'uppercase', transition: 'color 0.2s ease' }}
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

        return (
          <div 
            key={order.id} 
            style={{ 
              backgroundColor: '#050505', 
              border: '1px solid #111', 
              padding: '25px', 
              position: 'relative',
              opacity: isManageMode && !isSelected ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {/* ✖️ আইকন / গোল সিলেক্ট সার্কেল এরিয়া */}
            <div style={{ position: 'absolute', top: '25px', right: '25px', zIndex: 5 }}>
              {isManageMode ? (
                <div 
                  onClick={() => toggleSelectOrder(order.id)}
                  style={{ width: '16px', height: '16px', borderRadius: '50%', border: isSelected ? '1px solid #fff' : '1px solid #333', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}
                >
                  {isSelected && <span style={{ color: '#000', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setSingleOrderToHide(order.id);
                    setModalType('single');
                  }}
                  style={{ background: 'none', border: 'none', color: '#222', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none', transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#222'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* লাইন ১: প্রোডাক্টের নাম (২ লাইনে অটো-র‍্যাপ হবে) */}
            <div style={{ paddingRight: '35px', marginBottom: '18px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '400', color: '#efefef', letterSpacing: '0.5px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textTransform: 'uppercase' }}>
                {order.product_name}
              </h4>
            </div>

            {/* লাইন ২: দাম এবং তারিখ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <span style={{ fontSize: '15px', color: '#fff', fontWeight: '500', fontFamily: 'monospace' }}>
                ৳{order.total_amount}
              </span>
              <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {formattedDate}
              </span>
            </div>

            {/* লাইন ৩: মার্জিত টিক চিহ্ন (✓) ওয়ালা স্টেপার */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.01)', paddingTop: '15px' }}>
              {statusSteps.map((step, idx) => {
                const currentStatusLower = order.status ? order.status.toLowerCase() : 'pending';
                const currentStepIndex = statusSteps.indexOf(currentStatusLower);

                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#fff' : 'transparent',
                      border: isCompleted ? '1px solid #fff' : '1px solid #222',
                      boxShadow: isCurrent ? '0 0 8px #fff' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}>
                      {isCompleted && (
                        <span style={{ color: '#000', fontSize: '8px', fontWeight: 'bold', lineHeight: 1 }}>✓</span>
                      )}
                    </div>
                    <span style={{ fontSize: '8px', letterSpacing: '0.5px', marginTop: '8px', color: isCompleted ? '#aaa' : '#333', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}

      {/* 🔒 ম্যানেজ মোড অ্যাক্টিভ হলে ভেসে ওঠা ফিক্সড অ্যাকশন বার */}
      {isManageMode && selectedOrderIds.length > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', maxWidth: '460px', width: 'calc(100% - 40px)', backgroundColor: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <span style={{ color: '#000', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
            {selectedOrderIds.length} SELECTED
          </span>
          <button 
            onClick={() => setModalType('bulk')}
            style={{ background: 'none', border: 'none', color: '#ff4444', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'monospace' }}
          >
            HIDE FROM VIEW
          </button>
        </div>
      )}

      {/* 🛡️ লাক্সারি আইনি ওভারলে মোডাল */}
      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '30px', textAlign: 'center' }}>
            <h4 style={{ color: '#fff', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px', fontFamily: 'monospace', fontWeight: '400' }}>
              REMOVE FROM DASHBOARD?
            </h4>
            <p style={{ color: '#555', fontSize: '10px', lineHeight: '1.6', letterSpacing: '0.5px', marginBottom: '25px', textAlign: 'justify', fontFamily: 'monospace' }}>
              THIS ACTION WILL HIDE THE SELECTED ITEM(S) FROM YOUR ACTIVE PROFILE VIEW. FOR REGULATORY COMPLIANCE, TAX AUDITS, AND CONSUMER PROTECTION LAWS, INTANGIBLE TRANSACTION LOGS ARE SECURELY IMMUTABLE WITHIN OUR CENTRAL ARCHIVED LEDGER.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button disabled={isHiding} onClick={() => setModalType(null)} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#fff', border: '1px solid #222', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace' }}>
                CANCEL
              </button>
              <button 
                disabled={isHiding} 
                onClick={() => {
                  const targets = modalType === 'single' && singleOrderToHide ? [singleOrderToHide] : selectedOrderIds;
                  executeHideOrders(targets);
                }} 
                style={{ flex: 1, padding: '12px', backgroundColor: '#fff', color: '#000', border: '1px solid #fff', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' }}
              >
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
