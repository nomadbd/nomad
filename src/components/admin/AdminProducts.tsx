import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // আপনার সুপাবেস ক্লায়েন্ট পাথ নিশ্চিত করুন

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  created_at?: string;
  image_url?: string;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 📝 নতুন প্রোডাক্ট যোগ করার ফর্ম স্টেট
  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('APPAREL');
  const [newImage, setNewImage] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  // 🔍 সার্চ স্টেট
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 🔹 প্রোডাক্ট ক্যাটালগ লোড করা
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          stock_quantity,
          category,
          created_at,
          product_media (
            media_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stock_quantity: p.stock_quantity ?? 0,
          category: p.category || 'GENERAL',
          created_at: p.created_at,
          image_url: p.product_media?.[0]?.media_url || 'https://via.placeholder.com/100x120?text=NO+IMAGE'
        }));
        setProducts(formatted);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ➕ নতুন প্রোডাক্ট ডাটাবেজে সাবমিট করা
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      alert('Product Name and Price are required.');
      return;
    }

    try {
      setSubmitting(true);

      // ১. products টেবিলে ইনসার্ট
      const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert([
          {
            name: newName,
            price: parseFloat(newPrice),
            stock_quantity: parseInt(newStock || '0', 10),
            category: newCategory,
            description: newDescription
          }
        ])
        .select()
        .single();

      if (prodError) throw prodError;

      // ২. ইমেজ থাকলে product_media টেবিলে ইনসার্ট
      if (newImage && newProd) {
        const { error: mediaError } = await supabase
          .from('product_media')
          .insert([
            {
              product_id: newProd.id,
              media_url: newImage
            }
          ]);
        if (mediaError) console.error('Media insert error:', mediaError);
      }

      alert('PRODUCT CREATED SUCCESSFULLY');
      setShowAddModal(false);
      // ফর্ম রিসেট
      setNewName('');
      setNewPrice('');
      setNewStock('');
      setNewImage('');
      setNewDescription('');
      
      fetchProducts(); // রিফ্রেশ
    } catch (err: any) {
      console.error('Error creating product:', err);
      alert(err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✏️ দ্রুত স্টক আপডেট করা
  const handleStockUpdate = async (productId: string, currentStock: number, change: number) => {
    const updated = Math.max(0, currentStock + change);
    try {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: updated } : p));
      
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: updated })
        .eq('id', productId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update stock:', err);
      fetchProducts(); // ব্যর্থ হলে পূর্বের স্টেট ফেরত আনবে
    }
  };

  // ❌ প্রোডাক্ট ডিলিট করা
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('ARE YOU SURE YOU WANT TO REMOVE THIS PRODUCT FROM HQ?')) return;

    try {
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Could not delete product. It may be linked to existing orders.');
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* 🔝 হেডার ও অ্যাকশন বাটন */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', margin: 0, color: '#fff' }}>
            PRODUCT CATALOG & STOCK
          </h2>
          <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', letterSpacing: '1px' }}>
            MANAGE ITEMS, PRICING AND INVENTORY LEVELS
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            padding: '10px 18px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease'
          }}
        >
          + ADD NEW PRODUCT
        </button>
      </div>

      {/* 🔍 সার্চ ও ফিল্টার বার */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px', display: 'flex', gap: '15px' }}>
        <input
          type="text"
          placeholder="SEARCH PRODUCTS BY NAME OR CATEGORY..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#000',
            border: '1px solid #333',
            padding: '10px 15px',
            color: '#fff',
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            outline: 'none'
          }}
        />
      </div>

      {/* 📋 প্রোডাক্ট গ্রিড / লিস্ট */}
      {loading ? (
        <div style={{ color: '#888', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '11px', textAlign: 'center', padding: '50px 0' }}>
          LOADING CATALOG ARCHIVES...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '40px', textAlign: 'center', color: '#666', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '11px' }}>
          NO PRODUCTS FOUND IN CATALOG
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredProducts.map((product) => {
            const isLowStock = product.stock_quantity <= 3;
            const isOutOfStock = product.stock_quantity === 0;

            return (
              <div 
                key={product.id} 
                style={{ 
                  backgroundColor: '#050505', 
                  border: isOutOfStock ? '1px solid #ef444455' : '1px solid #1a1a1a', 
                  padding: '15px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px' 
                }}
              >
                {/* ইমেজ ও ক্যাটালগ ক্যাটাগরি */}
                <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#000', overflow: 'hidden' }}>
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#000', color: '#888', border: '1px solid #222', fontSize: '8px', padding: '2px 6px', fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 'bold' }}>
                    {product.category.toUpperCase()}
                  </span>
                </div>

                {/* প্রোডাক্ট টাইটেল ও মূল্য */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {product.name}
                  </h3>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>
                    ৳{product.price}
                  </span>
                </div>

                {/* 📦 স্টক স্ট্যাটাস কন্ট্রোল */}
                <div style={{ backgroundColor: '#000', border: '1px solid #111', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace', display: 'block', letterSpacing: '1px' }}>
                      IN STOCK
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: isOutOfStock ? '#ef4444' : isLowStock ? '#eab308' : '#00ff66' }}>
                      {product.stock_quantity} UNITS {isOutOfStock && '(OUT)'}
                    </span>
                  </div>

                  {/* স্টক বাড়োনো/কমানোর বাটন */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleStockUpdate(product.id, product.stock_quantity, -1)}
                      style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', width: '28px', height: '28px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                      title="Decrease Stock"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStockUpdate(product.id, product.stock_quantity, 1)}
                      style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', width: '28px', height: '28px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                      title="Increase Stock"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ডিলিট বাটন */}
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '6px',
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    marginTop: 'auto'
                  }}
                >
                  REMOVE FROM CATALOG
                </button>

              </div>
            );
          })}
        </div>
      )}

      {/* ➕ নতুন প্রোডাক্ট তৈরির পপআপ/মোডাল (MODAL) */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#050505', border: '1px solid #333', width: '100%', maxWidth: '500px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', color: '#fff', fontFamily: 'monospace' }}>
                ADD NEW PRODUCT TO HQ
              </span>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div>
                <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>PRODUCT NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NOMAD OVERSIZED HOODIE"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>PRICE (BDT) *</label>
                  <input
                    type="number"
                    required
                    placeholder="2500"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>INITIAL STOCK</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>CATEGORY</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="APPAREL">APPAREL</option>
                  <option value="FOOTWEAR">FOOTWEAR</option>
                  <option value="ACCESSORIES">ACCESSORIES</option>
                  <option value="LIMITED EDITION">LIMITED EDITION</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>IMAGE URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>DESCRIPTION</label>
                <textarea
                  rows={3}
                  placeholder="Product specifications..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: '10px'
                }}
              >
                {submitting ? 'CREATING...' : 'PUBLISH TO CATALOG'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
