import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Order, OrderHistoryProps } from './orderTypes';
import { printOrderInvoice } from './printOrderInvoice';
import OrderCard from './OrderCard';
import HideOrdersModal from './HideOrdersModal';

const OrderHistory: React.FC<OrderHistoryProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [modalType, setModalType] = useState<'single' | 'bulk' | null>(null);
  const [singleOrderToHide, setSingleOrderToHide] = useState<string | null>(null);
  const [isHiding, setIsHiding] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
            products:product_id (
              name,
              product_media (
                media_url
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedOrders = data.map((order: any) => {
          const items = (order.order_items || []).map((item: any) => {
            const firstImage = item.products?.product_media?.[0]?.media_url || 'https://via.placeholder.com/80x100';

            return {
              product_name: item.products?.name || 'NOMAD PREMIUM APPAREL',
              product_image: firstImage,
              size: item.size || 'N/A',
              color: item.color || 'N/A',
              quantity: item.quantity || 1,
              price: item.price_at_purchase || 0,
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
            items: items,
          };
        });
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const executeHideOrders = async (idsToHide: string[]) => {
    if (idsToHide.length === 0) return;

    try {
      setIsHiding(true);
      const { error } = await supabase
        .from('orders')
        .update({ is_hidden: true })
        .in('id', idsToHide);

      if (!error) {
        setOrders((prev) => prev.filter((order) => !idsToHide.includes(order.id)));
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
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
        {[1, 2].map((skeletonCard) => (
          <div
            key={skeletonCard}
            style={{
              backgroundColor: '#070708',
              border: '1px solid #1D1D20',
              borderRadius: '10px',
              padding: '20px',
              height: '170px',
            }}
          />
        ))}
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

        .order-item-attrs {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .attr-text {
          font-size: 10px;
          color: #888;
          font-family: monospace;
          font-weight: bold;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .attr-val {
          color: #fff;
        }

        .attr-dot {
          width: 3px;
          height: 3px;
          background-color: #444;
          border-radius: 50%;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .attr-color {
            flex-basis: 100%;
            margin-top: 2px;
          }
          .dot-desktop-only {
            display: none;
          }
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

      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isManageMode={isManageMode}
          isSelected={selectedOrderIds.includes(order.id)}
          onToggleSelect={toggleSelectOrder}
          onDownloadInvoice={printOrderInvoice}
          onRequestSingleHide={(id) => {
            setSingleOrderToHide(id);
            setModalType('single');
          }}
        />
      ))}

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
        <HideOrdersModal
          isHiding={isHiding}
          onCancel={() => setModalType(null)}
          onConfirm={() => {
            const targets = modalType === 'single' && singleOrderToHide ? [singleOrderToHide] : selectedOrderIds;
            executeHideOrders(targets);
          }}
        />
      )}

    </div>
  );
};

export default OrderHistory;
