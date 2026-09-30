import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import StoreLink from './StoreLink';
import EarningsCard from './EarningsCard';
import SalesAndOrdersCard from './SalesAndOrdersCard';
import StorefrontProductsCard, { AssignedProduct } from './StorefrontProductsCard';

interface AmbassadorDashboardProps {
  ambassadorData: any;
  profile: any;
  ambassadorState: any;
  isOwner?: boolean;
}

export default function AmbassadorDashboard({
  ambassadorData: initialAmbassadorData,
  profile,
  ambassadorState,
  isOwner = true
}: AmbassadorDashboardProps) {
  const [ambassadorData, setAmbassadorData] = useState<any>(initialAmbassadorData);
  const ambassadorId = ambassadorData?.id || ambassadorData?.user_id || profile?.id;
  const name = ambassadorData?.display_name || profile?.user_metadata?.full_name || 'AMBASSADOR';

  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ডাটাবেজ থেকে কমিশন ও ডিসকাউন্ট পারসেন্টেজ নিশ্চিত করা
  const ambassadorCommissionRate = Number(ambassadorData?.commission_rate ?? 0);
  const customerDiscountRate = Number(ambassadorData?.discount_percent ?? 0);

  // Ambassador Data Refresh Function
  const refreshAmbassadorData = async () => {
    if (!ambassadorId) return;
    try {
      const { data, error } = await supabase
        .from('ambassador')
        .select('*')
        .eq('id', ambassadorId)
        .single();

      if (!error && data) {
        setAmbassadorData(data);
      }
    } catch (err) {
      console.error('Error refreshing ambassador data:', err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);

    try {
      const targetIds = [
        ambassadorData?.id,
        ambassadorData?.user_id,
        profile?.id
      ].filter(Boolean);

      if (targetIds.length === 0) {
        setLoadingProducts(false);
        return;
      }

      const { data: assignData, error: assignError } = await supabase
        .from('ambassador_products')
        .select('product_id, is_visible, ambassador_id')
        .in('ambassador_id', targetIds);

      if (assignError) throw assignError;

      if (!assignData || assignData.length === 0) {
        setAssignedProducts([]);
        setLoadingProducts(false);
        return;
      }

      const productIds = assignData.map((item: any) => item.product_id);

      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, name, price, category')
        .in('id', productIds);

      if (prodError) throw prodError;

      const { data: mediaData } = await supabase
        .from('product_media')
        .select('product_id, media_url, sort_order')
        .in('product_id', productIds)
        .order('sort_order', { ascending: true });

      const formatted: AssignedProduct[] = assignData
        .map((item: any) => {
          const prod = prodData?.find((p: any) => p.id === item.product_id);
          if (!prod) return null;

          const mediaObj = mediaData?.find((m: any) => m.product_id === prod.id);

          return {
            id: prod.id,
            title: prod.name || 'Untitled Product',
            price: prod.price || 0,
            regular_price: prod.price || 0, // মূল দাম
            image_url: mediaObj?.media_url || '',
            category: prod.category || '',
            is_visible: item.is_visible ?? true,
          };
        })
        .filter((item): item is AssignedProduct => item !== null);

      setAssignedProducts(formatted);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [ambassadorData, profile]);

  const handleToggleVisibility = async (productId: string, currentStatus: boolean) => {
    const targetIds = [ambassadorData?.id, ambassadorData?.user_id, profile?.id].filter(Boolean);
    if (targetIds.length === 0) return;

    setTogglingId(productId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('ambassador_products')
        .update({ is_visible: newStatus })
        .in('ambassador_id', targetIds)
        .eq('product_id', productId);

      if (error) throw error;

      setAssignedProducts((prev) =>
        prev.map((prod) => (prod.id === productId ? { ...prod, is_visible: newStatus } : prod))
      );
    } catch (err: any) {
      alert('Failed to update visibility: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box'
      }}
    >
      {!isOwner ? (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '24px', marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '3px', textTransform: 'uppercase' }}>CURATED BY AMBASSADOR</span>
            <h1 style={{ fontSize: '22px', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase' }}>{name}'S NOMAD COLLECTION</h1>
          </header>

          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>LOADING COLLECTION...</div>
          ) : assignedProducts.filter((p) => p.is_visible).length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', border: '1px dashed #222222', backgroundColor: '#050505', borderRadius: '8px' }}>
              <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>NO PRODUCTS CURATED YET.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {assignedProducts.filter((p) => p.is_visible).map((product) => (
                <div key={product.id} style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}>
                  <div style={{ width: '100%', height: '160px', backgroundColor: '#111', marginBottom: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                    {product.image_url ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <h3 style={{ fontSize: '13px', margin: '0 0 4px 0', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</h3>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#34d399' }}>৳{product.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
          {/* ১. স্টোর লিংক সেকশন */}
          <StoreLink ambassadorData={ambassadorData} profile={profile} isAmbassadorActive={true} />

          {/* ২. আর্নিং ও উইথড্রল সেকশন */}
          <EarningsCard
            ambassadorId={ambassadorId}
            availableBalance={ambassadorData?.unpaid_balance ?? ambassadorData?.available_balance ?? ambassadorState?.available_balance ?? 0}
            pendingBalance={ambassadorData?.pending_balance ?? ambassadorState?.pending_balance ?? 0}
            totalEarned={ambassadorData?.total_earned ?? ambassadorState?.total_earned ?? 0}
            payoutDetails={ambassadorData?.payout_details}
            onSuccessRefresh={refreshAmbassadorData}
          />

          {/* ৩. সেলস ও অর্ডার পারফরম্যান্স সেকশন */}
          <SalesAndOrdersCard ambassadorId={ambassadorId} />

          {/* ৪. প্রোডাক্ট ম্যানেজমেন্ট (ডাটাবেজ থেকে কমিশন ও কাস্টমার ডিসকাউন্ট ডাইনামিকালি পাস করা হচ্ছে) */}
          <StorefrontProductsCard
            assignedProducts={assignedProducts}
            loadingProducts={loadingProducts}
            togglingId={togglingId}
            onToggleVisibility={handleToggleVisibility}
            ambassadorCommissionRate={ambassadorCommissionRate}
            customerDiscountRate={customerDiscountRate}
          />
        </div>
      )}
    </div>
  );
}
