import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import StoreLink from './StoreLink';
import EarningsCard from './EarningsCard'; // <--- EarningsCard ইম্পোর্ট করা হলো

interface AmbassadorDashboardProps {
  ambassadorData: any;
  profile: any;
  ambassadorState: any;
  isOwner?: boolean;
}

interface AssignedProduct {
  assignment_id?: string;
  id: string;
  title: string;
  price: number;
  image_url?: string;
  category?: string;
  is_visible: boolean;
}

export default function AmbassadorDashboard({
  ambassadorData,
  profile,
  ambassadorState,
  isOwner = true
}: AmbassadorDashboardProps) {
  const name = ambassadorData?.display_name || profile?.user_metadata?.full_name || 'AMBASSADOR';

  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

      const { data: mediaData, error: mediaError } = await supabase
        .from('product_media')
        .select('product_id, media_url, sort_order')
        .in('product_id', productIds)
        .order('sort_order', { ascending: true });

      if (mediaError) {
        console.warn('Media fetch notice:', mediaError.message);
      }

      const formatted: AssignedProduct[] = assignData
        .map((item: any) => {
          const prod = prodData?.find((p: any) => p.id === item.product_id);
          if (!prod) return null;

          const mediaObj = mediaData?.find((m: any) => m.product_id === prod.id);
          const imageUrl = mediaObj?.media_url || '';

          return {
            id: prod.id,
            title: prod.name || 'Untitled Product',
            price: prod.price || 0,
            image_url: imageUrl,
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
    const targetIds = [
      ambassadorData?.id,
      ambassadorData?.user_id,
      profile?.id
    ].filter(Boolean);

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
        prev.map((prod) =>
          prod.id === productId ? { ...prod, is_visible: newStatus } : prod
        )
      );
    } catch (err: any) {
      alert('Failed to update product visibility: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleWithdrawClick = () => {
    // এখানে পরবর্তীতে উইথড্র প্রসেসিং ফ্লো যুক্ত করা যাবে
    alert('Withdrawal request initiated!');
  };

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '16px 0', 
      boxSizing: 'border-box', 
      color: '#ffffff', 
      fontFamily: "'Inter', sans-serif" 
    }}>
      {!isOwner ? (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '24px', marginBottom: '32px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '3px', textTransform: 'uppercase' }}>
              CURATED BY AMBASSADOR
            </span>
            <h1 style={{ fontSize: '24px', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {name}'S NOMAD COLLECTION
            </h1>
          </header>

          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>
              LOADING COLLECTION...
            </div>
          ) : assignedProducts.filter((p) => p.is_visible).length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', border: '1px dashed #222222', backgroundColor: '#050505' }}>
              <p style={{ color: '#888888', fontSize: '12px', letterSpacing: '1px' }}>
                NO PRODUCTS CURATED FOR THIS COLLECTION YET.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', width: '100%' }}>
              {assignedProducts.filter((p) => p.is_visible).map((product) => (
                <div key={product.id} style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '6px' }}>
                  <div style={{ width: '100%', height: '200px', backgroundColor: '#111', marginBottom: '12px', overflow: 'hidden', borderRadius: '4px' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '10px' }}>NO IMAGE</div>
                    )}
                  </div>
                  <h3 style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#fff' }}>{product.title}</h3>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#34d399' }}>৳{product.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
          {/* ১. স্টোর লিংক সেকশন */}
          <StoreLink 
            ambassadorData={ambassadorData}
            profile={profile} 
            isAmbassadorActive={true} 
          />

          {/* ২. আর্নিং ও ওয়ালেট সেকশন */}
          <EarningsCard 
            availableBalance={ambassadorData?.available_balance ?? ambassadorState?.available_balance}
            pendingBalance={ambassadorData?.pending_balance ?? ambassadorState?.pending_balance}
            totalEarned={ambassadorData?.total_earned ?? ambassadorState?.total_earned}
            onWithdrawClick={handleWithdrawClick}
          />

          {/* ৩. STOREFRONT PRODUCTS SECTION */}
          <section style={{ 
            backgroundColor: '#050505', 
            border: '1px solid #1a1a1a', 
            padding: '16px', 
            borderRadius: '8px', 
            width: '100%', 
            boxSizing: 'border-box' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '14px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  STOREFRONT PRODUCTS
                </h2>
                <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0 0' }}>
                  Select which assigned products to display on your public showcase.
                </p>
              </div>
              <span style={{ fontSize: '10px', color: '#aaa', border: '1px solid #222', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#0a0a0a', flexShrink: 0 }}>
                {assignedProducts.filter(p => p.is_visible).length} / {assignedProducts.length} VISIBLE
              </span>
            </div>

            {loadingProducts ? (
              <div style={{ fontSize: '11px', color: '#666', padding: '12px 0' }}>LOADING ASSIGNED PRODUCTS...</div>
            ) : assignedProducts.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#666', padding: '20px 0', textAlign: 'center', border: '1px dashed #222', borderRadius: '4px' }}>
                NO PRODUCTS ASSIGNED BY ADMIN YET.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                {assignedProducts.map((product) => (
                  <div key={product.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px', 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #1a1a1a', 
                    borderRadius: '6px',
                    gap: '12px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#111', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#111', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#555', flexShrink: 0 }}>NO IMAGE</div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>৳{product.price} {product.category ? `• ${product.category}` : ''}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(product.id, product.is_visible)}
                      disabled={togglingId === product.id}
                      style={{
                        backgroundColor: product.is_visible ? '#082210' : '#111111',
                        color: product.is_visible ? '#4dff88' : '#666666',
                        border: `1px solid ${product.is_visible ? '#115522' : '#333333'}`,
                        padding: '6px 12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      {togglingId === product.id ? 'UPDATING...' : product.is_visible ? 'SHOWING ON STORE' : 'HIDDEN FROM STORE'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
