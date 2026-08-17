import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

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

  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('APPAREL');
  const [newImage, setNewImage] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      alert('Product Name and Price are required.');
      return;
    }

    try {
      setSubmitting(true);

      const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert([{
          name: newName,
          price: parseFloat(newPrice),
          stock_quantity: parseInt(newStock || '0', 10),
          category: newCategory,
          description: newDescription
        }])
        .select()
        .single();

      if (prodError) throw prodError;

      if (newImage && newProd) {
        await supabase
          .from('product_media')
          .insert([{ product_id: newProd.id, media_url: newImage }]);
      }

      alert('PRODUCT CREATED SUCCESSFULLY');
      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error('Error creating product:', err);
      alert(err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewPrice('');
    setNewStock('');
    setNewImage('');
    setNewDescription('');
    setNewCategory('APPAREL');
  };

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
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('ARE YOU SURE YOU WANT TO REMOVE THIS PRODUCT FROM HQ?')) return;

    try {
      setProducts(prev => prev.filter(p => p.id !== productId));
      const { error } = await supabase.from('products').delete().eq('id', productId);
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
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', margin: 0, color: '#fff' }}>
            PRODUCT CATALOG & STOCK
          </h2>
          <span style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>
            MANAGE ITEMS, PRICING AND INVENTORY LEVELS
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            padding: '11px 20px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          + ADD NEW PRODUCT
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px', marginBottom: '25px', borderRadius: '2px' }}>
        <input
          type="text"
          placeholder="SEARCH PRODUCTS BY NAME OR CATEGORY..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#000',
            border: '1px solid #333',
            padding: '11px 15px',
            color: '#fff',
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>
          LOADING CATALOG ARCHIVES...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '50px 20px', textAlign: 'center', color: '#666' }}>
          NO PRODUCTS FOUND IN CATALOG
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
          gap: '18px',
          width: '100%'
        }}>
          {filteredProducts.map((product) => {
            const isLowStock = product.stock_quantity <= 3;
            const isOutOfStock = product.stock_quantity === 0;

            return (
              <div 
                key={product.id} 
                style={{ 
                  backgroundColor: '#050505', 
                  border: isOutOfStock ? '1px solid #ef444455' : '1px solid #1a1a1a', 
                  padding: '16px', 
                  borderRadius: '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  width: '100%'
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#000', overflow: 'hidden', borderRadius: '2px' }}>
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    left: '10px', 
                    backgroundColor: '#000', 
                    color: '#888', 
                    border: '1px solid #222', 
                    fontSize: '8px', 
                    padding: '2px 6px', 
                    fontFamily: 'monospace',
                    letterSpacing: '1px' 
                  }}>
                    {product.category.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                    {product.name}
                  </h3>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>
                    ৳{product.price}
                  </span>
                </div>

                <div style={{ 
                  backgroundColor: '#000', 
                  border: '1px solid #111', 
                  padding: '12px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#666', display: 'block' }}>IN STOCK</span>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 'bold', 
                      color: isOutOfStock ? '#ef4444' : isLowStock ? '#eab308' : '#22c55e' 
                    }}>
                      {product.stock_quantity} UNITS
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleStockUpdate(product.id, product.stock_quantity, -1)} 
                      style={{ width: '32px', height: '32px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>
                      −
                    </button>
                    <button onClick={() => handleStockUpdate(product.id, product.stock_quantity, 1)} 
                      style={{ width: '32px', height: '32px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  style={{
                    marginTop: 'auto',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    padding: '8px',
                    fontSize: '9.5px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    cursor: 'pointer'
                  }}
                >
                  REMOVE FROM CATALOG
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          padding: '20px' 
        }}>
          <div style={{ 
            backgroundColor: '#050505', 
            border: '1px solid #333', 
            width: '100%', 
            maxWidth: '480px', 
            padding: '25px', 
            borderRadius: '2px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#fff', fontSize: '14px', letterSpacing: '2px', marginBottom: '20px', marginTop: 0 }}>
              ADD NEW PRODUCT
            </h3>
            
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px', fontFamily: 'monospace' }}>PRODUCT NAME *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter product name"
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px', fontFamily: 'monospace' }}>PRICE (৳) *</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px', fontFamily: 'monospace' }}>STOCK QUANTITY</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px', fontFamily: 'monospace' }}>CATEGORY</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="APPAREL, etc."
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px', fontFamily: 'monospace' }}>IMAGE URL</label>
                <input
                  type="text"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="https://..."
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px', fontFamily: 'monospace' }}>DESCRIPTION</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Product description..."
                  rows={3}
                  style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #444', color: '#fff', padding: '10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, backgroundColor: '#fff', border: 'none', color: '#000', padding: '10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}
                >
                  {submitting ? 'SAVING...' : 'CREATE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
