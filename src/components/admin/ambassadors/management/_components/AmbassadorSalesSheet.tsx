import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon } from '@/components/icons';
import { AmbassadorProfile } from './AmbassadorCard';

interface SalesItem {
  product_id: string;
  product_name: string;
  product_image_url?: string;
  total_quantity: number;
  total_revenue: number;
}

interface AmbassadorSalesSheetProps {
  ambassador: AmbassadorProfile;
  onClose: () => void;
}

export const AmbassadorSalesSheet: React.FC<AmbassadorSalesSheetProps> = ({
  ambassador,
  onClose,
}) => {
  const [salesData, setSalesData] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesBreakdown = async () => {
      setLoading(true);
      setError(null);

      try {
        // ১. ওই অ্যাম্বাসেডরের যেসব অর্ডার CANCELLED নয় সেগুলো আনা
        const { data: orders, error: orderErr } = await supabase
          .from('orders')
          .select('id')
          .eq('ambassador_id', ambassador.ambassador_id)
          .neq('status', 'CANCELLED');

        if (orderErr) throw orderErr;

        if (!orders || orders.length === 0) {
          setSalesData([]);
          setLoading(false);
          return;
        }

        const orderIds = orders.map((o) => o.id);

        // ২. ওই অর্ডারগুলোর প্রোডাক্ট আইটেম নিয়ে আসা
        const { data: items, error: itemErr } = await supabase
          .from('order_items')
          .select('product_id, product_name, quantity, price_at_purchase')
          .in('order_id', orderIds);

        if (itemErr) throw itemErr;

        // ৩. প্রোডাক্ট অনুযায়ী গ্রুপ করা (Group by product_id)
        const grouped: { [key: string]: SalesItem } = {};

        (items || []).forEach((item: any) => {
          const pid = item.product_id;
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price_at_purchase) || 0;

          if (!grouped[pid]) {
            grouped[pid] = {
              product_id: pid,
              product_name: item.product_name || 'Unknown Product',
              product_image_url: '',
              total_quantity: 0,
              total_revenue: 0,
            };
          }

          grouped[pid].total_quantity += qty;
          grouped[pid].total_revenue += qty * price;
        });

        const productIds = Object.keys(grouped);

        // ৪. product_media টেবিল থেকে প্রোডাক্টের ছবি নিয়ে আসা (sort_order অনুযায়ী)
        if (productIds.length > 0) {
          const { data: mediaData } = await supabase
            .from('product_media')
            .select('product_id, media_url')
            .in('product_id', productIds)
            .order('sort_order', { ascending: true });

          if (mediaData) {
            mediaData.forEach((media: any) => {
              // প্রথম যে ছবিটি আসবে সেটি সেট হবে (যেহেতু sort_order অনুযায়ী সাজানো)
              if (grouped[media.product_id] && !grouped[media.product_id].product_image_url) {
                grouped[media.product_id].product_image_url = media.media_url;
              }
            });
          }
        }

        // ৫. সবচেয়ে বেশি বিক্রিত প্রোডাক্ট আগে দেখাবে (Sort by revenue)
        const result = Object.values(grouped).sort((a, b) => b.total_revenue - a.total_revenue);
        setSalesData(result);
      } catch (err: any) {
        console.error('Error fetching sales breakdown:', err);
        setError(err.message || 'Failed to load sales breakdown.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesBreakdown();
  }, [ambassador.ambassador_id]);

  const grandTotalRevenue = salesData.reduce((acc, curr) => acc + curr.total_revenue, 0);
  const grandTotalItems = salesData.reduce((acc, curr) => acc + curr.total_quantity, 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          backgroundColor: '#09090b',
          borderTop: '1px solid #1f1f23',
          borderRadius: '16px 16px 0 0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>
              Sales Breakdown
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', marginTop: '2px' }}>
              {ambassador.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              borderRadius: '50%',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        {/* Summary Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#121215', padding: '12px', borderRadius: '8px', border: '1px solid #1f1f23' }}>
          <div>
            <div style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace' }}>TOTAL REVENUE</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#64ffda', fontFamily: 'monospace', marginTop: '2px' }}>
              ৳{grandTotalRevenue.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace' }}>ITEMS SOLD</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace', marginTop: '2px' }}>
              {grandTotalItems} pcs
            </div>
          </div>
        </div>

        {/* Product List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>
            LOADING SALES DATA...
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', fontSize: '11px', fontFamily: 'monospace', padding: '12px', backgroundColor: '#180808', borderRadius: '6px' }}>
            {error}
          </div>
        ) : salesData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#555', fontSize: '11px', fontFamily: 'monospace' }}>
            NO SALES RECORDED YET.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {salesData.map((item) => (
              <div
                key={item.product_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#121215',
                  border: '1px solid #1f1f23',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#1f1f23', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#71717a' }}>
                      N/A
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product_name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', marginTop: '2px' }}>
                      Sold: {item.total_quantity} pcs
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, fontFamily: 'monospace' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                    ৳{item.total_revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
