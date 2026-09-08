import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function AmbassadorStore() {
  const { slug } = useParams<{ slug: string }>();
  const [ambassador, setAmbassador] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) fetchStoreData();
  }, [slug]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: ambData, error: ambError } = await supabase
        .from('ambassador')
        .select('*')
        .eq('assigned_slug', slug)
        .single();

      if (ambError || !ambData) {
        setError('Storefront not found or invalid link.');
        return;
      }

      setAmbassador(ambData);
      localStorage.setItem('ref_ambassador_id', ambData.id);

      const { data: assigned, error: prodError } = await supabase
        .from('ambassador_products')
        .select('product_id, products(*)')
        .eq('ambassador_id', ambData.id);

      if (!prodError && assigned) {
        const productList = assigned.map((item: any) => item.products).filter(Boolean);
        setProducts(productList);
      }
    } catch (err) {
      setError('Failed to load storefront.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        LOADING VIP STOREFRONT...
      </div>
    );
  }

  if (error || !ambassador) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', border: '1px solid #222', padding: '30px', borderRadius: '8px', backgroundColor: '#0a0a0a' }}>
          <h3 style={{ color: '#ff4d4d', margin: '0 0 10px 0' }}>STORE NOT FOUND</h3>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ borderBottom: '1px solid #222', paddingBottom: '24px', marginBottom: '32px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '3px', textTransform: 'uppercase' }}>OFFICIAL PARTNER SHOWCASE</span>
          <h1 style={{ fontSize: '24px', marginTop: '8px', fontWeight: '500', letterSpacing: '1px' }}>
            {ambassador.recipient_identifier || 'EXCLUSIVE STORE'}
          </h1>
        </header>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '60px 0' }}>
            <p style={{ fontSize: '14px' }}>No products currently featured in this showcase.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {products.map((p) => (
              <div key={p.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#fff' }}>{p.name}</h3>
                <p style={{ color: '#888', fontSize: '12px', height: '36px', overflow: 'hidden' }}>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>৳{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
