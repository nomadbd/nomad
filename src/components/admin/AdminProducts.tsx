import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { uploadToCloudinary } from '../../cloudinary';

interface Product {
  id: string;
  name: string;
  description?: string;
  details?: any;
  sizes?: string[];
  colors?: string[];
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

  // Form States
  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('APPAREL');
  const [newDescription, setNewDescription] = useState<string>('');

  // Details JSONB Fields
  const [newFit, setNewFit] = useState<string>('Regular Fit');
  const [newGsm, setNewGsm] = useState<string>('180');
  const [newMadeIn, setNewMadeIn] = useState<string>('Bangladesh');
  const [newMaterial, setNewMaterial] = useState<string>('100% Premium Cotton');

  const [newSizes, setNewSizes] = useState<string>('S, M, L, XL');
  const [newColors, setNewColors] = useState<string>('BLACK, WHITE');

  // Multiple Media Files State
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          details,
          sizes,
          colors,
          price,
          stock_quantity,
          category,
          created_at,
          product_media (
            media_url,
            media_type,
            sort_order
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map((p: any) => {
          // Sort media by sort_order if available
          const sortedMedia = p.product_media?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          const primaryImage = sortedMedia?.[0]?.media_url || 'https://via.placeholder.com/100x120?text=NO+IMAGE';

          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            details: p.details || {},
            sizes: p.sizes || [],
            colors: p.colors || [],
            price: p.price,
            stock_quantity: p.stock_quantity ?? 0,
            category: p.category || 'GENERAL',
            created_at: p.created_at,
            image_url: primaryImage
          };
        });
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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setMediaFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? ('video' as const) : ('image' as const)
      }));
      setMediaPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeSelectedMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      showNotification('PRODUCT NAME AND PRICE ARE REQUIRED.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Format details object for JSONB column
      const detailsJson = {
        FIT: newFit,
        GSM: newGsm,
        "MADE IN": newMadeIn,
        MATERIAL: newMaterial
      };

      // 2. Format sizes and colors arrays
      const sizesArray = newSizes.split(',').map(s => s.trim()).filter(Boolean);
      const colorsArray = newColors.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

      // 3. Insert Product basic info
      const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert([{
          name: newName,
          price: parseFloat(newPrice),
          stock_quantity: parseInt(newStock || '0', 10),
          category: newCategory,
          description: newDescription,
          details: detailsJson,
          sizes: sizesArray,
          colors: colorsArray
        }])
        .select()
        .single();

      if (prodError) throw prodError;

      // 4. Upload Multiple Images & Videos to Cloudinary and insert into product_media
      if (mediaFiles.length > 0 && newProd) {
        setUploadingMedia(true);
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const mediaUrl = await uploadToCloudinary(file);
          const mediaType = file.type.startsWith('video') ? 'video' : 'image';

          await supabase.from('product_media').insert([{
            product_id: newProd.id,
            media_url: mediaUrl,
            media_type: mediaType,
            sort_order: i
          }]);
        }
        setUploadingMedia(false);
      }

      setShowAddModal(false);
      resetForm();
      fetchProducts();
      showNotification('PRODUCT & MULTIPLE MEDIA FILES UPLOADED SUCCESSFULLY.');
    } catch (err: any) {
      console.error('Error creating product:', err);
      showNotification(err.message || 'FAILED TO CREATE PRODUCT.', 'error');
    } finally {
      setSubmitting(false);
      setUploadingMedia(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewPrice('');
    setNewStock('');
    setNewDescription('');
    setNewCategory('APPAREL');
    setNewFit('Regular Fit');
    setNewGsm('180');
    setNewMadeIn('Bangladesh');
    setNewMaterial('100% Premium Cotton');
    setNewSizes('S, M, L, XL');
    setNewColors('BLACK, WHITE');
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleStockUpdate = async (productId: string, currentStock: number, change: number) => {
    const updated = Math.max(0, currentStock + change);
    try {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: updated } : p));
      const { error } = await supabase.from('products').update({ stock_quantity: updated }).eq('id', productId);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to update stock:', err);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('ARE YOU SURE YOU WANT TO REMOVE THIS PRODUCT?')) return;

    try {
      setProducts(prev => prev.filter(p => p.id !== productId));
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      showNotification('PRODUCT REMOVED FROM CATALOG.');
    } catch (err) {
      console.error('Failed to delete product:', err);
      showNotification('COULD NOT DELETE PRODUCT.', 'error');
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', position: 'relative' }}>
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          backgroundColor: '#0a0a0a', border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#ffffff'}`,
          color: '#ffffff', padding: '14px 20px', borderRadius: '2px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px'
        }}>
          <span style={{ color: notification.type === 'error' ? '#ef4444' : '#22c55e', marginRight: '8px' }}>
            {notification.type === 'error' ? '✕' : '✓'}
          </span>
          {notification.message}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', margin: 0, color: '#fff' }}>PRODUCT CATALOG</h2>
          <span style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>MANAGE INVENTORY & MEDIA</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '11px 20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + ADD NEW PRODUCT
        </button>
      </div>

      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px', marginBottom: '25px' }}>
        <input
          type="text"
          placeholder="SEARCH PRODUCTS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '11px 15px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>LOADING...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {filteredProducts.map((product) => (
            <div key={product.id} style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#000' }}>
                <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>{product.name}</h3>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>৳{product.price}</span>
              </div>
              <div style={{ backgroundColor: '#000', border: '1px solid #111', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#22c55e' }}>Stock: {product.stock_quantity}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => handleStockUpdate(product.id, product.stock_quantity, -1)} style={{ width: '28px', height: '28px', background: '#111', color: '#fff', cursor: 'pointer' }}>-</button>
                  <button onClick={() => handleStockUpdate(product.id, product.stock_quantity, 1)} style={{ width: '28px', height: '28px', background: '#111', color: '#fff', cursor: 'pointer' }}>+</button>
                </div>
              </div>
              <button onClick={() => handleDeleteProduct(product.id)} style={{ backgroundColor: 'transparent', border: '1px solid #ef444455', color: '#ef4444', padding: '8px', fontSize: '10px', cursor: 'pointer' }}>REMOVE</button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#050505', border: '1px solid #333', width: '100%', maxWidth: '520px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#fff', fontSize: '14px', letterSpacing: '2px', marginBottom: '20px', marginTop: 0 }}>ADD NEW PRODUCT</h3>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px' }}>PRODUCT NAME *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Product Name" style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px' }}>PRICE (৳) *</label>
                  <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px' }}>STOCK</label>
                  <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="0" style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px' }}>CATEGORY</label>
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }} />
              </div>

              {/* MULTIPLE IMAGES & VIDEOS UPLOAD SECTION */}
              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px' }}>PRODUCT IMAGES & VIDEOS (Multiple allowed)</label>
                <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '8px', color: '#fff', fontSize: '11px', boxSizing: 'border-box', cursor: 'pointer' }} />

                {mediaPreviews.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {mediaPreviews.map((media, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', border: '1px solid #444', backgroundColor: '#000' }}>
                        {media.type === 'video' ? (
                          <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={media.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button type="button" onClick={() => removeSelectedMedia(idx)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px' }}>DESCRIPTION (Bio)</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }} />
              </div>

              {/* DETAILS (JSONB) */}
              <div style={{ border: '1px dashed #333', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>SPECIFICATIONS (DETAILS)</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={newFit} onChange={(e) => setNewFit(e.target.value)} placeholder="Fit" style={{ flex: 1, background: '#000', border: '1px solid #333', padding: '8px', color: '#fff', fontSize: '11px' }} />
                  <input type="text" value={newGsm} onChange={(e) => setNewGsm(e.target.value)} placeholder="GSM" style={{ flex: 1, background: '#000', border: '1px solid #333', padding: '8px', color: '#fff', fontSize: '11px' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={newMadeIn} onChange={(e) => setNewMadeIn(e.target.value)} placeholder="Made In" style={{ flex: 1, background: '#000', border: '1px solid #333', padding: '8px', color: '#fff', fontSize: '11px' }} />
                  <input type="text" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} placeholder="Material" style={{ flex: 1, background: '#000', border: '1px solid #333', padding: '8px', color: '#fff', fontSize: '11px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newSizes} onChange={(e) => setNewSizes(e.target.value)} placeholder="Sizes: S, M, L" style={{ flex: 1, background: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px' }} />
                <input type="text" value={newColors} onChange={(e) => setNewColors(e.target.value)} placeholder="Colors: BLACK, WHITE" style={{ flex: 1, background: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #444', color: '#fff', padding: '10px', cursor: 'pointer' }}>CANCEL</button>
                <button type="submit" disabled={submitting || uploadingMedia} style={{ flex: 1, background: '#fff', border: 'none', color: '#000', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {uploadingMedia ? 'UPLOADING MEDIA...' : submitting ? 'SAVING...' : 'CREATE PRODUCT'}
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