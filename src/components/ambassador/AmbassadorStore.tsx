import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { useCart } from '../../context/CartContext';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

interface Ambassador {
  id: string;
  name: string;
  slug: string;
  discount_percent?: number;
}

export default function AmbassadorStore() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchAmbassadorData();
  }, [slug]);

  async function fetchAmbassadorData() {
    setLoading(true);
    setNotFound(false);

    try {
      // ১. অ্যাম্বাসেডর প্রোফাইল ফেচ করা
      const { data: ambData, error: ambError } = await supabase
        .from('ambassador')
        .select('*')
        .eq('slug', slug)
        .single();

      if (ambError || !ambData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setAmbassador(ambData);

      // ২. কেবল এই অ্যাম্বাসেডরের সিলেক্ট করা প্রোডাক্টগুলো ফেচ করা
      const { data: prodData, error: prodError } = await supabase
        .from('ambassador_products')
        .select('products(*)')
        .eq('ambassador_id', ambData.id);

      if (!prodError && prodData) {
        const fetchedProducts = prodData
          .map((item: any) => item.products)
          .filter(Boolean);
        setProducts(fetchedProducts);
      }
    } catch (err) {
      console.error('Error loading storefront:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#888', fontFamily: 'monospace' }}>
        LOADING SHOWCASE...
      </div>
    );
  }

  if (notFound || !ambassador) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', textAlign: 'center', padding: '20px' }}>
        <h2 style={{ fontSize: '20px', letterSpacing: '2px' }}>SHOWCASE NOT FOUND</h2>
        <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>
          The ambassador showcase link you accessed does not exist or has been updated.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          EXPLORE NOMAD STORE
        </button>
      </div>
    );
  }

  const discountPercent = ambassador.discount_percent || 10;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '60px' }}>
      
      {/* লোগোর নিচে ছোট ব্র্যান্ডিং ট্যাগ */}
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '10px 20px', textAlign: 'center', backgroundColor: '#050505' }}>
        <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#d4af37', textTransform: 'uppercase', fontWeight: 'bold' }}>
          CURATED BY {ambassador.name}
        </span>
      </div>

      {/* ডিসকাউন্ট তথ্য ব্যানার */}
      <div style={{ backgroundColor: '#111', borderBottom: '1px solid #222', padding: '12px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#ccc', letterSpacing: '0.5px' }}>
          EXCLUSIVE VIP SHOWCASE — Enjoy <strong style={{ color: '#d4af37' }}>{discountPercent}% OFF</strong> on items in this collection.
        </p>
      </div>

      {/* প্রোডাক্ট গ্রিড */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <p style={{ fontSize: '14px', letterSpacing: '1px' }}>No products currently featured in this showcase.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
            {products.map((product) => {
              const discountedPrice = Math.round(product.price * (1 - discountPercent / 100));

              return (
                <div key={product.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '260px', backgroundColor: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                      NO IMAGE
                    </div>
                  )}

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '500' }}>{product.name}</h4>
                      
                      {/* মূল মূল্য কেটে ডিসকাউন্ট মূল্য প্রদর্শন */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#d4af37' }}>
                          ৳{discountedPrice.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '13px', color: '#666', textDecoration: 'line-through' }}>
                          ৳{product.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        // কার্টে প্রোডাক্ট যোগ করার সাথে শুধু এই প্রোডাক্টের জন্যই অ্যাম্বাসেডর ট্র্যাকিং অবজেক্ট পাস করা
                        addToCart({
                          ...product,
                          discountedPrice,
                          ambassadorId: ambassador.id,
                          discountPercent
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#fff',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
