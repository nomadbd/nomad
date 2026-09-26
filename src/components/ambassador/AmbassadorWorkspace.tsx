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

  // লাইভ ডিবাগ লগের জন্য স্টেট
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const logMessage = (msg: string) => {
    console.log(msg);
    setDebugLogs((prev) => [...prev, msg]);
  };

  // প্রোডাক্ট ও মিডিয়া লোড করার মূল ফাংশন
  const fetchProducts = async () => {
    setLoadingProducts(true);
    setDebugLogs([]);

    logMessage('🚀 Starting product fetch operation...');

    try {
      const targetIds = [
        ambassadorData?.id,
        ambassadorData?.user_id,
        profile?.id
      ].filter(Boolean);

      logMessage(`🔍 Target Ambassador IDs: ${JSON.stringify(targetIds)}`);

      if (targetIds.length === 0) {
        logMessage('⚠️ ERROR: No valid Ambassador ID found!');
        setLoadingProducts(false);
        return;
      }

      // ১. ambassador_products টেবিল থেকে অ্যাসাইন করা প্রোডাক্ট আইডি রিড করা
      logMessage('📡 Querying ambassador_products table...');
      const { data: assignData, error: assignError } = await supabase
        .from('ambassador_products')
        .select('product_id, is_visible, ambassador_id')
        .in('ambassador_id', targetIds);

      if (assignError) throw assignError;

      if (!assignData || assignData.length === 0) {
        logMessage('⚠️ STOPPING: No assigned products found for this Ambassador.');
        setAssignedProducts([]);
        setLoadingProducts(false);
        return;
      }

      const productIds = assignData.map((item: any) => item.product_id);
      logMessage(`🔑 Found Product IDs: ${JSON.stringify(productIds)}`);

      // ২. products টেবিল থেকে নাম, দাম ও ক্যাটাগরি রিড করা (name কলাম ব্যবহার করা হয়েছে)
      logMessage('📡 Querying products table...');
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, name, price, category')
        .in('id', productIds);

      if (prodError) throw prodError;

      // ৩. product_media টেবিল থেকে ছবির media_url রিড করা
      logMessage('📡 Querying product_media table...');
      const { data: mediaData, error: mediaError } = await supabase
        .from('product_media')
        .select('product_id, media_url, sort_order')
        .in('product_id', productIds)
        .order('sort_order', { ascending: true });

      if (mediaError) {
        console.warn('Media fetch notice:', mediaError.message);
      }

      // ৪. ডাটা একত্রে মার্জ (Merge) করা
      const formatted: AssignedProduct[] = assignData
        .map((item: any) => {
          const prod = prodData?.find((p: any) => p.id === item.product_id);
          if (!prod) return null;

          // ঐ প্রোডাক্টের প্রথম মিডিয়াটি রিড করা
          const mediaObj = mediaData?.find((m: any) => m.product_id === prod.id);
          const imageUrl = mediaObj?.media_url || '';

          return {
            id: prod.id,
            title: prod.name || 'Untitled Product', // Database 'name' -> Component 'title'
            price: prod.price || 0,
            image_url: imageUrl,
            category: prod.category || '',
            is_visible: item.is_visible ?? true,
          };
        })
        .filter((item): item is AssignedProduct => item !== null);

      logMessage(`✅ SUCCESS: Successfully loaded ${formatted.length} products with images!`);
      setAssignedProducts(formatted);
    } catch (err: any) {
      logMessage(`❌ CATCH ERROR: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [ambassadorData, profile]);

  // স্টোরে প্রোডাক্টের ভিজিবিলিটি টগল করার ফাংশন
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: '#ffffff', fontFamily: 'sans-serif' }}>
      
      {/* 🛠️ LIVE DEBUG CONSOLE VIEW */}
      <div style={{ backgroundColor: '#090d16', border: '1px solid #1e293b', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>
            🛠️ LIVE DEBUG CONSOLE
          </span>
          <button 
            onClick={fetchProducts} 
            style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '4px 10px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
          >
            RE-RUN DIAGNOSTIC
          </button>
        </div>
        <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
          {debugLogs.length === 0 ? (
            <span style={{ color: '#64748b' }}>Running diagnostic check...</span>
          ) : (
            debugLogs.map((log, index) => (
              <div 
                key={index} 
                style={{ 
                  color: log.includes('❌') ? '#f87171' : log.includes('⚠️') ? '#fbbf24' : log.includes('✅') ? '#34d399' : '#94a3b8',
                  wordBreak: 'break-all'
                }}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* PUBLIC CUSTOMER VIEW */}
      {!isOwner ? (
        <div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
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
        /* AMBASSADOR DASHBOARD VIEW */
        <div>
          <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '2px', textTransform: 'uppercase' }}>NOMAD PORTAL</span>
              <h1 style={{ fontSize: '20px', margin: '4px 0 0 0', letterSpacing: '1px', textTransform: 'uppercase' }}>
                WELCOME, {name}
              </h1>
            </div>
            <div style={{ border: '1px solid #333333', padding: '6px 12px', fontSize: '11px', letterSpacing: '1px', borderRadius: '4px' }}>
              COMMISSION: <b style={{ color: '#ffffff' }}>{commissionRate}%</b>
            </div>
          </header>

          {/* STATS SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '6px' }}>
              <span style={{ color: '#888888', fontSize: '10px', letterSpacing: '1px' }}>UNPAID BALANCE</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                ৳{ambassadorState?.unpaidBalance || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '6px' }}>
              <span style={{ color: '#888888', fontSize: '10px', letterSpacing: '1px' }}>TOTAL EARNED</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                ৳{ambassadorState?.totalEarned || 0}
              </div>
            </div>
          </div>

          <StoreLinkBanner slug={ambassadorState?.slug || ambassadorData?.assigned_slug} />

          {/* STOREFRONT PRODUCTS CONTROL */}
          <section style={{ marginTop: '24px', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '24px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '14px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  STOREFRONT PRODUCTS
                </h2>
                <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0 0' }}>
                  Select which assigned products to display on your public showcase.
                </p>
              </div>
              <span style={{ fontSize: '10px', color: '#aaa', border: '1px solid #222', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#0a0a0a' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assignedProducts.map((product) => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#111' }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', backgroundColor: '#111', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#555' }}>NO IMAGE</div>
                      )}
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{product.title}</div>
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
                        padding: '6px 14px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
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
      )}
    </div>
  );
}
