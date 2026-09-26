import React, { useEffect, useState } from 'react';
import AnalyticsChart from './AnalyticsChart';
import StoreLinkBanner from './StoreLinkBanner';
import { supabase } from '@/supabaseClient';

interface AmbassadorWorkspaceProps {
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

export default function AmbassadorWorkspace({
  ambassadorData,
  profile,
  ambassadorState,
  isOwner = true
}: AmbassadorWorkspaceProps) {
  const name = ambassadorData?.display_name || profile?.user_metadata?.full_name || 'AMBASSADOR';
  const commissionRate = ambassadorData?.commission_rate || 0;

  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ২-ধাপের নিরাপদ প্রোডাক্ট লোড লজিক (Supabase Join Conflict ছাড়াই কাজ করবে)
  const fetchProducts = async () => {
    const ambId = ambassadorData?.id || ambassadorData?.user_id || profile?.id;
    if (!ambId) {
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    try {
      // ধাপ ১: অ্যাম্বাসেডরের এসাইন করা প্রডাক্ট আইডি ও ভিজিবিলিটি আনা
      let { data: assignData, error: assignError } = await supabase
        .from('ambassador_products')
        .select('product_id, is_visible')
        .eq('ambassador_id', ambId);

      // যদি ambassador_id ম্যাচ না করে, তবে বিকল্প ID দিয়ে চেষ্টা করা
      if ((!assignData || assignData.length === 0) && ambassadorData?.user_id && ambassadorData?.user_id !== ambId) {
        const { data: altAssignData } = await supabase
          .from('ambassador_products')
          .select('product_id, is_visible')
          .eq('ambassador_id', ambassadorData.user_id);
        
        if (altAssignData && altAssignData.length > 0) {
          assignData = altAssignData;
        }
      }

      if (assignError) throw assignError;

      if (!assignData || assignData.length === 0) {
        setAssignedProducts([]);
        return;
      }

      // ধাপ ২: আইডিগুলোর প্রডাক্ট ডিটেইলস নিয়ে আসা
      const productIds = assignData.map((item: any) => item.product_id);
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, title, price, image_url, category')
        .in('id', productIds);

      if (prodError) throw prodError;

      // ধাপ ৩: উভয় ডাটা মার্জ করে স্টেট আপডেট করা
      const formatted: AssignedProduct[] = assignData
        .map((item: any) => {
          const prod = prodData?.find((p: any) => p.id === item.product_id);
          if (!prod) return null;

          return {
            id: prod.id,
            title: prod.title,
            price: prod.price,
            image_url: prod.image_url,
            category: prod.category,
            is_visible: item.is_visible ?? true,
          };
        })
        .filter((item): item is AssignedProduct => item !== null);

      setAssignedProducts(formatted);
    } catch (err: any) {
      console.error('Error loading products:', err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [ambassadorData?.id, ambassadorData?.user_id]);

  // প্রডাক্টের Visibility টগল করার লজিক
  const handleToggleVisibility = async (productId: string, currentStatus: boolean) => {
    const ambId = ambassadorData?.id || ambassadorData?.user_id;
    if (!ambId) return;

    setTogglingId(productId);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('ambassador_products')
        .update({ is_visible: newStatus })
        .eq('ambassador_id', ambId)
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

  // ১. পাবলিক স্টোরফ্রন্ট ভিউ (কাস্টমারদের জন্য)
  if (!isOwner) {
    const publicProducts = assignedProducts.filter((p) => p.is_visible);

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: '#ffffff', fontFamily: 'monospace, sans-serif' }}>
        <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '24px', marginBottom: '32px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '3px', textTransform: 'uppercase' }}>
            CURATED BY AMBASSADOR
          </span>
          <h1 style={{ fontSize: '24px', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {name}'S NOMAD COLLECTION
          </h1>
          <p style={{ fontSize: '11px', color: '#aaaaaa', marginTop: '8px', letterSpacing: '0.5px' }}>
            Handpicked essentials curated exclusively for you.
          </p>
        </header>

        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>
            LOADING COLLECTION...
          </div>
        ) : publicProducts.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', border: '1px dashed #222222', backgroundColor: '#050505' }}>
            <p style={{ color: '#888888', fontSize: '12px', letterSpacing: '1px' }}>
              NO PRODUCTS CURATED FOR THIS COLLECTION YET.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {publicProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#050505',
                  border: '1px solid #1a1a1a',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: '100%', height: '220px', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#444', fontSize: '10px' }}>NO IMAGE</span>
                  )}
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <h3 style={{ fontSize: '13px', margin: 0, color: '#fff', fontWeight: 'bold' }}>
                    {product.title}
                  </h3>
                  {product.category && (
                    <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                  )}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #111' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                      ৳{product.price}
                    </span>
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '2px',
                      }}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ২. অ্যাম্বাসেডর ড্যাশবোর্ড ভিউ
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: '#ffffff', fontFamily: 'monospace, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '2px', textTransform: 'uppercase' }}>NOMAD PORTAL</span>
          <h1 style={{ fontSize: '20px', margin: '4px 0 0 0', letterSpacing: '1px', textTransform: 'uppercase' }}>
            WELCOME, {name}
          </h1>
        </div>
        <div style={{ border: '1px solid #333333', padding: '6px 12px', fontSize: '11px', letterSpacing: '1px' }}>
          COMMISSION: <b style={{ color: '#ffffff' }}>{commissionRate}%</b>
        </div>
      </header>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ color: '#888888', fontSize: '10px', letterSpacing: '1px' }}>UNPAID BALANCE</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
            ৳{ambassadorState?.unpaidBalance || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ color: '#888888', fontSize: '10px', letterSpacing: '1px' }}>TOTAL EARNED</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
            ৳{ambassadorState?.totalEarned || 0}
          </div>
        </div>
      </div>

      <StoreLinkBanner slug={ambassadorState?.slug || ambassadorData?.assigned_slug} />

      {/* STOREFRONT PRODUCTS SECTION */}
      <section style={{ marginTop: '40px', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '14px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              STOREFRONT PRODUCTS
            </h2>
            <p style={{ fontSize: '10px', color: '#888', margin: '4px 0 0 0' }}>
              Select which assigned products to display on your public showcase.
            </p>
          </div>
          <span style={{ fontSize: '10px', color: '#666', border: '1px solid #222', padding: '4px 8px' }}>
            {assignedProducts.filter(p => p.is_visible).length} / {assignedProducts.length} VISIBLE
          </span>
        </div>

        {loadingProducts ? (
          <div style={{ fontSize: '11px', color: '#666' }}>LOADING ASSIGNED PRODUCTS...</div>
        ) : assignedProducts.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#666', padding: '20px 0', textAlign: 'center', border: '1px dashed #222' }}>
            NO PRODUCTS ASSIGNED BY ADMIN YET.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignedProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#1a1a1a' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{product.title}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>৳{product.price}</div>
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
                    cursor: 'pointer',
                    letterSpacing: '1px',
                  }}
                >
                  {togglingId === product.id
                    ? 'UPDATING...'
                    : product.is_visible
                    ? 'SHOWING ON STORE'
                    : 'HIDDEN FROM STORE'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: '32px' }}>
        <AnalyticsChart totalEarned={ambassadorState?.totalEarned} />
      </div>
    </div>
  );
}
