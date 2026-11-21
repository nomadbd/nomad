import React, { useEffect, useState, CSSProperties } from 'react';
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

function AmbassadorDashboardSkeleton({ isOwner }: { isOwner: boolean }) {
  const shimmerStyle: CSSProperties = {
    backgroundColor: '#2A2A2E',
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0) 100%)',
    backgroundSize: '200% 100%',
    animation: 'fbAmbassadorShimmer 1.35s ease-in-out infinite',
  };

  const sectionCardStyle: CSSProperties = {
    backgroundColor: '#09090B',
    border: '1px solid #18181B',
    borderRadius: '16px',
    padding: '18px',
    boxSizing: 'border-box',
  };

  const innerBoxStyle: CSSProperties = {
    backgroundColor: '#0E0E11',
    border: '1px solid #1C1C21',
    borderRadius: '12px',
    padding: '14px',
    boxSizing: 'border-box',
  };

  if (!isOwner) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        <style>{`
          @keyframes fbAmbassadorShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}>
            <div style={{ ...shimmerStyle, width: '100%', height: '160px', marginBottom: '10px', borderRadius: '6px' }} />
            <div style={{ ...shimmerStyle, width: '76%', height: '13px', marginBottom: '8px', borderRadius: '4px' }} />
            <div style={{ ...shimmerStyle, width: '44%', height: '14px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes fbAmbassadorShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ১. YOUR STOREFRONT LINK সেকশন স্কেলিটন */}
      <div style={{ padding: '4px 2px', boxSizing: 'border-box' }}>
        <div style={{ ...shimmerStyle, width: '148px', height: '10px', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...shimmerStyle, width: '168px', height: '13px', borderRadius: '4px', marginBottom: '6px' }} />
            <div style={{ ...shimmerStyle, width: '132px', height: '18px', borderRadius: '4px' }} />
          </div>
          <div style={{ ...shimmerStyle, width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
        </div>
      </div>

      {/* ২. WALLET সেকশন স্কেলিটন (Available Balance + Withdraw, নিচে Pending ও Total Earned) */}
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ ...shimmerStyle, width: '64px', height: '10px', borderRadius: '4px' }} />
          <div style={{ ...shimmerStyle, width: '72px', height: '10px', borderRadius: '4px' }} />
        </div>

        <div style={{ ...innerBoxStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...shimmerStyle, width: '124px', height: '10px', borderRadius: '4px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, width: '56px', height: '24px', borderRadius: '6px' }} />
          </div>
          <div style={{ ...shimmerStyle, width: '104px', height: '38px', borderRadius: '10px', flexShrink: 0 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={innerBoxStyle}>
            <div style={{ ...shimmerStyle, width: '66px', height: '10px', borderRadius: '4px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, width: '42px', height: '20px', borderRadius: '5px' }} />
          </div>
          <div style={innerBoxStyle}>
            <div style={{ ...shimmerStyle, width: '96px', height: '10px', borderRadius: '4px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, width: '42px', height: '20px', borderRadius: '5px' }} />
          </div>
        </div>
      </div>

      {/* ৩. ORDERS সেকশন স্কেলিটন (২x২ গ্রিড: Total, Success, Pending, Cancelled) */}
      <div style={sectionCardStyle}>
        <div style={{ ...shimmerStyle, width: '62px', height: '10px', borderRadius: '4px', marginBottom: '14px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {[1, 2, 3, 4].map((box) => (
            <div key={box} style={innerBoxStyle}>
              <div style={{ ...shimmerStyle, width: '68px', height: '10px', borderRadius: '4px', marginBottom: '10px' }} />
              <div style={{ ...shimmerStyle, width: '28px', height: '22px', borderRadius: '5px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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

  useEffect(() => {
    if (initialAmbassadorData) {
      setAmbassadorData(initialAmbassadorData);
    }
  }, [initialAmbassadorData]);

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

  const isDashboardLoading = Boolean(ambassadorState?.loading) || (isOwner && !ambassadorData && !profile);

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

          {loadingProducts || isDashboardLoading ? (
            <AmbassadorDashboardSkeleton isOwner={false} />
          ) : assignedProducts.filter((p) => p.is_visible).length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', border: '1px dashed #222222', backgroundColor: '#050505', borderRadius: '8px' }}>
              <p style={{ color: '#888888', fontSize: '12px', margin: 0 }}>NO PRODUCTS CURATED YET.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {assignedProducts.filter((p) => p.is_visible).map((product) => (
                <div key={product.id} style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}>
                  <div style={{ width: '100%', height: '160px', backgroundColor: '#111', marginBottom: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                    {product.image_url ? <img src={product.image_url} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover' }} /> : null}
                  </div>
                  <h3 style={{ fontSize: '13px', margin: '0 0 4px 0', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</h3>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#34d399' }}>৳{product.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isDashboardLoading ? (
        <AmbassadorDashboardSkeleton isOwner={true} />
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
