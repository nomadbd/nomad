import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  category: string;
  sizes: string | string[];
  price: number;
  description?: string;
  // Supabase টেবিলে ইমেজের কলামের নাম সাধারণত image_path, image_url, বা শুধু image হয়ে থাকে। 
  // এখানে আমরা কয়েকটি কমন অপশন হ্যান্ডেল করছি।
  image_url?: string;
  image_path?: string;
  image?: string;
}

const SearchOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchProducts();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchProducts = async () => {
    try {
      const query = `%${searchQuery}%`;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${query},category.ilike.${query},sizes.cs.{${searchQuery}}`); 
        
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.${query},category.ilike.${query}`);
        
        if (fallbackError) throw fallbackError;
        setResults(fallbackData || []);
      } else {
        setResults(data || []);
      }
    } catch (err) {
      console.error('Error searching products:', err);
    }
  };

  // ইমেজ ইউআরএল পাওয়ার একটি সেইফ ফাংশন
  const getProductImage = (product: Product) => {
    // ১. সরাসরি পূর্ণাঙ্গ URL থাকলে
    const rawUrl = product.image_url || product.image_path || product.image;
    if (!rawUrl) return null;
    if (rawUrl.startsWith('http')) return rawUrl;

    // ২. ইমেজটি যদি Supabase Storage-এর ভেতর থাকে (বাকেট নাম 'product-images' বা একই ধরণের কিছু হলে)
    // আপনার বাকেট নাম অনুযায়ী নিচের 'product-images' পরিবর্তন করে নিতে পারেন।
    const { data } = supabase.storage.from('product-images').getPublicUrl(rawUrl);
    return data?.publicUrl || rawUrl;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'black', zIndex: 1000, padding: '24px', boxSizing: 'border-box',
      overflowY: 'auto', fontFamily: 'sans-serif'
    }}>
      {/* Search Header - Exactly matching your UI */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '40px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '15px'
      }}>
        <input 
          type="text" 
          placeholder="Search nomad products..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', background: 'none', border: 'none', 
            color: 'white', fontSize: '24px', outline: 'none',
            letterSpacing: '1px'
          }}
          autoFocus
        />

        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Close search"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Premium Minimal Results Area */}
      <div style={{ color: 'white' }}>
        {results.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '40px',
            marginTop: '20px'
          }}>
            {results.map((product) => {
              const imageUrl = getProductImage(product);
              return (
                <div key={product.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Category with "SEE MORE" on the right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      textTransform: 'uppercase', 
                      fontSize: '14px', 
                      letterSpacing: '2px', 
                      fontWeight: 'bold',
                      color: '#fff' 
                    }}>
                      {product.category || 'PRODUCT'}
                    </span>
                    <button style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#888', 
                      fontSize: '12px', 
                      letterSpacing: '1px', 
                      textTransform: 'uppercase', 
                      cursor: 'pointer',
                      padding: 0
                    }}>
                      SEE MORE
                    </button>
                  </div>

                  {/* Product Image */}
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '3/4', 
                    backgroundColor: '#111', 
                    overflow: 'hidden',
                  }}>
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', height: '100%', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', color: '#333',
                        letterSpacing: '4px', fontSize: '14px'
                      }}>
                        NOMAD
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div>
                    <h3 style={{ 
                      fontSize: '22px', 
                      fontWeight: 'bold', 
                      margin: '0 0 8px 0',
                      letterSpacing: '0.5px',
                      color: 'white'
                    }}>
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#ccc',
                        lineHeight: '1.5', 
                        margin: '0 0 16px 0',
                        fontWeight: '300'
                      }}>
                        {product.description} <span style={{ color: '#888', cursor: 'pointer', fontSize: '13px' }}>see more</span>
                      </p>
                    )}

                    {/* Price and Add to Cart Action */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '12px'
                    }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        ৳{product.price}
                      </span>
                      <button style={{
                        background: 'none',
                        border: '1px solid white',
                        color: 'white',
                        padding: '12px 24px',
                        fontSize: '13px',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {searchQuery.trim().length > 0 && results.length === 0 && (
          <p style={{ 
            fontSize: '14px', 
            letterSpacing: '1px', 
            opacity: 0.5,
            marginTop: '40px' 
          }}>
            No products found matching "{searchQuery}"
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
