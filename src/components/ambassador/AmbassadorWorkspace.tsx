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

interface Product {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  category?: string;
}

export default function AmbassadorWorkspace({
  ambassadorData,
  profile,
  ambassadorState,
  isOwner = true
}: AmbassadorWorkspaceProps) {
  const name = ambassadorData?.display_name || profile?.user_metadata?.full_name || 'AMBASSADOR';
  const commissionRate = ambassadorData?.commission_rate || 0;

  // পাবলিক ভিউয়ের জন্য প্রোডাক্ট স্টেট
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // কাস্টমার বা সাধারণ ভিজিটরদের জন্য প্রোডাক্ট ফেচ করার লজিক
  useEffect(() => {
    if (!isOwner && ambassadorData?.id) {
      const fetchAssignedProducts = async () => {
        setLoadingProducts(true);
        try {
          const { data, error } = await supabase
            .from('ambassador_products')
            .select(`
              product_id,
              products (
                id,
                title,
                price,
                image_url,
                category
              )
            `)
            .eq('ambassador_id', ambassadorData.id);

          if (error) throw error;

          if (data) {
            const formattedProducts: Product[] = data
              .map((item: any) => item.products)
              .filter((p: any) => p !== null);

            setProducts(formattedProducts);
          }
        } catch (err: any) {
          console.error('Error loading assigned products:', err.message);
        } finally {
          setLoadingProducts(false);
        }
      };

      fetchAssignedProducts();
    }
  }, [isOwner, ambassadorData?.id]);

  // ১. সাধারণ ভিজিটর/কাস্টমারদের জন্য পাবলিক স্টোরফ্রন্ট ভিউ
  if (!isOwner) {
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

        {/* সাধারণ প্রোডাক্ট লিস্টের সেকশন (ডাইনামিক) */}
        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>
            LOADING COLLECTION...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', border: '1px dashed #222222', backgroundColor: '#050505' }}>
            <p style={{ color: '#888888', fontSize: '12px', letterSpacing: '1px' }}>
              NO PRODUCTS ASSIGNED TO THIS STORE YET.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {products.map((product) => (
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
                {/* প্রোডাক্ট ছবি */}
                <div style={{ width: '100%', height: '220px', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#444', fontSize: '10px' }}>NO IMAGE AVAILABLE</span>
                  )}
                </div>

                {/* প্রোডাক্ট ডিটেইলস */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <h3 style={{ fontSize: '13px', margin: 0, color: '#fff', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {product.title}
                  </h3>
                  {product.category && (
                    <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                        letterSpacing: '0.5px'
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

  // ২. অ্যাম্বাসেডর নিজের ড্যাশবোর্ড (ব্যালেন্স, অ্যানালিটিক্স, প্রাইভেট ভিউ)
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
      <div style={{ marginTop: '32px' }}>
        <AnalyticsChart totalEarned={ambassadorState?.totalEarned} />
      </div>
    </div>
  );
}
