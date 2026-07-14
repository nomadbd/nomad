import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // আপনার supabaseClient-এর সঠিক পাথ অনুযায়ী এটি পরিবর্তন করতে পারেন

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// প্রডাক্টের টাইপ ডেফিনিশন (আপনার ডাটাবেজ টেবিল অনুযায়ী)
interface Product {
  id: string;
  name: string;
  category: string;
  sizes: string | string[]; // sizes যদি টেক্সট বা অ্যারে হয়
  price: number;
  // আপনার অন্যান্য প্রয়োজনীয় ফিল্ড এখানে যোগ করতে পারেন
}

const SearchOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // সার্চ কুয়েরি পরিবর্তন হলে Supabase থেকে ডেটা নিয়ে আসার ফাংশন
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchProducts();
      } else {
        setResults([]); // ইনপুট খালি থাকলে রেজাল্ট মুছে যাবে
      }
    }, 400); // ৩০০-৪০০ মিলি-সেকেন্ড ডিবাউন্স টাইম (যাতে প্রতি ক্লিকে সার্ভারে রিকোয়েস্ট না যায়)

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const query = `%${searchQuery}%`;
      
      // Supabase-এর .or() ব্যবহার করে name, category, অথবা sizes কলামে সার্চ করা হচ্ছে
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${query},category.ilike.${query},sizes.ilike.${query}`);

      if (error) throw error;
      setResults(data || []);
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
      backgroundColor: 'black', zIndex: 1000, padding: '20px', boxSizing: 'border-box',
      overflowY: 'auto' // রেজাল্ট বেশি হলে স্ক্রল করার জন্য
    }}>
      {/* হেডার পার্ট - ইনপুট ও ক্লোজ বাটন (হুবহু আগের ডিজাইন) */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '40px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '10px'
      }}>
        <input 
          type="text" 
          placeholder="Search nomad products..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', background: 'none', border: 'none', 
            color: 'white', fontSize: '20px', outline: 'none'
          }}
          autoFocus
        />

        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Close search"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      {/* সার্চ রেজাল্ট দেখানোর সেকশন */}
      <div style={{ color: 'white' }}>
        {loading && <p style={{ opacity: 0.7 }}>Searching...</p>}
        
        {!loading && results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {results.map((product) => (
              <div key={product.id} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>{product.name}</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.7 }}>Category: {product.category}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.7 }}>Sizes: {Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes}</p>
                <p style={{ margin: '8px 0 0 0', fontWeight: 'bold' }}>${product.price}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && searchQuery.trim().length > 0 && results.length === 0 && (
          <p style={{ opacity: 0.7 }}>No products found matching "{searchQuery}"</p>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
