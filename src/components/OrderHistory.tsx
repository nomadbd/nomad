import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  product_name?: string;
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
        .select('id, created_at, total_amount, status, product_name')
        .eq('user_id', userId)
        .eq('is_hidden', false) // ডাটাবেজে এখন কলামটি আছে, তাই এটি কাজ করবে
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchOrders();
  }, [userId]);

  const executeHideOrders = async (idsToHide: string[]) => {
    try {
      setIsHiding(true);
      const { error } = await supabase
        .from('orders')
        .update({ is_hidden: true })
        .in('id', idsToHide);

      if (error) throw error;
      
      setOrders(orders.filter(order => !idsToHide.includes(order.id)));
      setSelectedOrderIds([]);
      setIsManageMode(false);
      setModalType(null);
      setSingleOrderToHide(null);
    } catch (err) {
      console.error('Error hiding orders:', err);
    } finally {
      setIsHiding(false);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '25px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ width: '60%', height: '16px', backgroundColor: '#111' }} className="skeleton-pulse" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '70px', height: '15px', backgroundColor: '#111' }} className="skeleton-pulse" />
              <div style={{ width: '90px', height: '15px', backgroundColor: '#111' }} className="skeleton-pulse" />
            </div>
          </div>
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } } .skeleton-pulse { animation: pulse 1.5s infinite ease-in-out; }`}</style>
      </div>
    );
  }

  if (orders.length === 0) {
    return <p style={{ textAlign: 'center', color: '#444', padding: '40px 0', fontSize: '11px', letterSpacing: '2px', fontFamily: 'monospace' }}>NO ORDER MEMORANDUM FOUND</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#444', fontFamily: 'monospace' }}>ORDER HISTORY</span>
        <button onClick={() => { setIsManageMode(!isManageMode); setSelectedOrderIds([]); }} style={{ background: 'none', border: 'none', color: isManageMode ? '#fff' : '#555', cursor: 'pointer', fontSize: '10px' }}>
          {isManageMode ? 'CANCEL' : 'MANAGE'}
        </button>
      </div>

      {orders.map((order) => {
        const formattedDate = new Date(order.created_at).toISOString().split('T')[0];
        const isSelected = selectedOrderIds.includes(order.id);

        return (
          <div key={order.id} style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '25px', position: 'relative', opacity: isManageMode && !isSelected ? 0.6 : 1 }}>
            <div style={{ position: 'absolute', top: '25px', right: '25px' }}>
              {isManageMode ? (
                <div onClick={() => toggleSelectOrder(order.id)} style={{ width: '16px', height: '16px', borderRadius: '50%', border: isSelected ? '1px solid #fff' : '1px solid #333', backgroundColor: isSelected ? '#fff' : 'transparent', cursor: 'pointer' }} />
              ) : (
                <button onClick={() => { setSingleOrderToHide(order.id); setModalType('single'); }} style={{ background: 'none', border: 'none', color: '#222', cursor: 'pointer' }}>✕</button>
              )}
            </div>
            <h4 style={{ margin: '0 0 18px 0', fontSize: '14px', color: '#efefef' }}>{order.product_name || 'NOMAD PREMIUM APPAREL'}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>
              <span>৳{order.total_amount}</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        );
      })}

      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '300px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '30px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: '12px', marginBottom: '20px' }}>REMOVE FROM DASHBOARD?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalType(null)} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#fff', border: '1px solid #222' }}>CANCEL</button>
              <button onClick={() => { const targets = modalType === 'single' && singleOrderToHide ? [singleOrderToHide] : selectedOrderIds; executeHideOrders(targets); }} style={{ flex: 1, padding: '10px', background: '#fff' }}>CONFIRM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
