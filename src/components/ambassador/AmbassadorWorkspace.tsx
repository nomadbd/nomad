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

  // প্রোডাক্ট লোড করার সমাধানকৃত লজিক
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      // সম্ভাব্য সকল অ্যাম্বাসেডর আইডি সংগ্রহ
      const targetIds = [
        ambassadorData?.id,
        ambassadorData?.user_id,
        profile?.id
      ].filter(Boolean);

      if (targetIds.length === 0) {
        setLoadingProducts(false);
        return;
      }

      // ১. ambassador_products থেকে অ্যাসাইন করা প্রডাক্ট রেকর্ড আনা
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

      // ২. প্রডাক্ট আইডিগুলোর তালিকা
      const productIds = assignData.map((item: any) => item.product_id);

      // ৩. products টেবিল থেকে বিস্তারিত ডাটা আনা
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, title, price, image_url, category')
        .in('id', productIds);

      if (prodError) throw prodError;

      // ৪. ডাটা মার্জ করা
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
  }, [ambassadorData, profile]);

  // Visibility Toggle করার লজিক
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

  // ১. পাবলিক ভিউ (কাস্টমারদের জন্য)
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
              <div key={product.id} style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '16px' }}>
                <div style={{ width: '100%', height: '180px', backgroundColor: '#111', marginBottom: '12px' }}>
                  {product.image_url && <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <h3 style={{ fontSize: '13px', margin: 0, color: '#fff' }}>{product.title}</h3>
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '8px' }}>৳{product.price}</p>
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
      <section style={{ marginTop: '24px', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '24px' }}>
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
              <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#111' }} />
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
                  }}
                >
                  {togglingId === product.id ? 'UPDATING...' : product.is_visible ? 'SHOWING ON STORE' : 'HIDDEN FROM STORE'}
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
