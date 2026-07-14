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
  image_url?: string; // যদি ইমেজের কলাম থাকে
  description?: string;
}

const SearchOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const query = `%${searchQuery}%`;
      
      // Supabase search logic with error-safe string formatting for arrays
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${query},category.ilike.${query},sizes.cs.{${searchQuery}}`); 
        // sizes যদি postgres array হয় তবে .cs. (contains) চমৎকার কাজ করে। 
        // যদি সেটি কাজ না করে, তবে নিচের ilike ব্যাকআপ হিসেবে কাজ করবে:
        
      if (error) {
        // Fallback search if sizes format causes issue
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
    } finally {
      setLoading(false);
    }
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
        {loading && (
          <p style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.5 }}>
            Searching...
          </p>
        )}
        
        {!loading && results.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '40px 20px',
            marginTop: '20px'
          }}>
            {results.map((product) => (
              <div key={product.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Product Image Placeholder matching your premium cards */}
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '3/4', 
                  backgroundColor: '#111', 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', height: '100%', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', color: '#333' 
                    }}>
                      NOMAD
                    </div>
                  )}
                </div>

                {/* Product details mimicking your main site design */}
                <div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    margin: '0 0 4px 0',
                    letterSpacing: '0.5px'
                  }}>
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p style={{ 
                      fontSize: '13px', 
                      opacity: 0.6, 
                      lineHeight: '1.4', 
                      margin: '0 0 8px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {product.description}
                    </p>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'baseline',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: '500' }}>
                      ৳{product.price}
                    </span>
                    <button style={{
                      background: 'none',
                      border: '1px solid white',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '12px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && searchQuery.trim().length > 0 && results.length === 0 && (
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
