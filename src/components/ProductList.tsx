import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// ১. TypeScript Interface - আপনার কলামগুলোর টাইপ নির্দিষ্ট করা
interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  created_at: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ২. ডাটাবেজ থেকে প্রোডাক্ট ফেচ করা
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }); // নতুন প্রোডাক্টগুলো আগে দেখাবে

    if (error) {
      console.error('Error fetching products:', error.message);
    } else if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px' }}>LOADING PRODUCTS...</p>;
  }

  if (products.length === 0) {
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px' }}>NO PRODUCTS AVAILABLE.</p>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '40px 30px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {products.map((product) => (
        <div key={product.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          
          {/* প্রোডাক্ট ইমেজ কন্টেইনার */}
          <div style={{ 
            width: '100%', 
            height: '320px', 
            backgroundColor: '#111', 
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #1a1a1a'
          }}>
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#333', fontSize: '11px' }}>NO IMAGE</div>
            )}
            
            {/* স্টক শেষ হয়ে গেলে আউট অফ স্টক ট্যাগ */}
            {product.stock_quantity <= 0 && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ff4444', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                OUT OF STOCK
              </div>
            )}
          </div>

          {/* প্রোডাক্ট ডিটেইলস */}
          <div style={{ marginTop: '15px' }}>
            <p style={{ fontSize: '11px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>
              {product.category}
            </p>
            <h3 style={{ fontSize: '15px', fontWeight: '500', color: '#fff', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>
              {product.name}
            </h3>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 15px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.description}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                ৳{product.price}
              </span>
              
              <button 
                disabled={product.stock_quantity <= 0}
                style={{
                  background: 'transparent',
                  border: '1px solid #333',
                  color: product.stock_quantity <= 0 ? '#444' : '#fff',
                  padding: '8px 16px',
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  cursor: product.stock_quantity <= 0 ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {product.stock_quantity <= 0 ? 'SOLD OUT' : 'ADD TO CART'}
              </button>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
