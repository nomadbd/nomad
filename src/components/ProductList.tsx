import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { uploadToCloudinary } from '../../cloudinary';

interface Product {
  id: string | number;
  name: string;
  description?: string;
  details?: any;
  sizes?: string[];
  colors?: string[];
  price: number;
  stock_quantity: number;
  status?: string;
  category?: string;
  created_at?: string;
  image_url?: string;
  product_media?: { media_url: string; media_type: string; sort_order?: number }[];
}

// 📸 প্রোডাক্ট গ্যালারি কম্পোনেন্ট
const ProductGallery = ({ images, productName }: { images: string[], productName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{ width: '100%', aspectRatio: '3/4', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
      {images.length > 0 ? (
        <img 
          src={images[currentIndex]} 
          alt={productName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '11px', fontFamily: 'monospace' }}>NO IMAGE</div>
      )}

      {images.length > 1 && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handlePrev} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handleNext} />

          <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {images.map((_, idx) => (
              <div 
                key={idx}
                style={{ 
                  width: '6px', height: '6px', borderRadius: '50%', 
                  background: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<string>('ALL');

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
        setProducts(data as Product[]);
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

      const detailsJson = {
        FIT: newFit,
        GSM: newGsm,
        "MADE IN": newMadeIn,
        MATERIAL: newMaterial
      };

      const sizesArray = newSizes.split(',').map(s => s.trim()).filter(Boolean);
      const colorsArray = newColors.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

      const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert([{
          name: newName,
          price: parseFloat(newPrice),
          stock_quantity: parseInt(newStock || '0', 10),
          category: newCategory.toUpperCase(),
          description: newDescription,
          details: detailsJson,
          sizes: sizesArray,
          colors: colorsArray
        }])
        .select()
        .single();

      if (prodError) throw prodError;

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

  const handleStockUpdate = async (productId: string | number, currentStock: number, change: number) => {
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

  const handleDeleteProduct = async (productId: string | number) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('PRODUCT ID COPIED TO CLIPBOARD.');
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(p.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = p.stock_quantity > 0;
    if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.stock_quantity === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'GENERAL')))];

  const groupedProducts: { [key: string]: Product[] } = {};
  filteredProducts.forEach(p => {
    const cat = p.category || 'GENERAL';
    if (!groupedProducts[cat]) groupedProducts[cat] = [];
    groupedProducts[cat].push(p);
  });

  // 💳 অ্যাডমিন প্রোডাক্ট কার্ড কম্পোনেন্ট (আপনার ডিজাইন অনুযায়ী আপডেট করা)
  const AdminProductCard = ({ product }: { product: Product }) => {
    const [isDescExpanded, setIsDescExpanded] = useState(false);
    const images = product.product_media?.map(m => m.media_url) || [];

    return (
      <div className="showroom-card-item" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px' }}>
        <ProductGallery images={images} productName={product.name} />

        <div style={{ marginTop: '12px', padding: '0 2px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span 
              onClick={() => copyToClipboard(String(product.id))}
              title="Click to copy ID"
              style={{ fontSize: '9px', color: '#888', cursor: 'pointer', background: '#000', padding: '2px 5px', border: '1px solid #333', fontFamily: 'monospace' }}
            >
              ID: {String(product.id).slice(0, 6)}... 📋
            </span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>৳{product.price}</span>
          </div>

          <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 6px 0', fontWeight: '600' }}>{product.name}</h3>

          {/* বর্ণনা ও স্পেসিফিকেশন সেকশন */}
          {product.description && (
            <div style={{ margin: '0 0 12px 0' }}>
              {(() => {
                const characterLimit = 65; 
                const isLongText = product.description.length > characterLimit;
                const displayedText = isLongText 
                  ? product.description.slice(0, characterLimit) + '...' 
                  : product.description;

                return !isDescExpanded ? (
                  <p style={{ fontSize: '12px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                    {displayedText}
                    {isLongText && (
                      <span 
                        onClick={() => setIsDescExpanded(true)}
                        style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', marginLeft: '6px', fontWeight: '500', display: 'inline' }}
                      >
                        see more
                      </span>
                    )}
                  </p>
                ) : (
                  <div style={{ animation: 'swapFadeIn 0.3s ease-in-out' }}>
                    <p style={{ fontSize: '12px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                      {product.description}
                    </p>

                    {product.details && Object.keys(product.details).length > 0 && (
                      <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '10px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', fontSize: '11px' }}>
                        {Object.entries(product.details).map(([key, value]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                            <span style={{ color: '#aaa', width: '85px', flexShrink: 0, textTransform: 'uppercase' }}>{key}</span>
                            <span style={{ color: '#444', marginRight: '8px', flexShrink: 0 }}>:</span>
                            <span style={{ color: '#fff', fontWeight: '400', flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <span 
                      onClick={() => setIsDescExpanded(false)}
                      style={{ fontSize: '11px', color: '#888', cursor: 'pointer', marginTop: '10px', display: 'inline-block' }}
                    >
                      see less
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* স্টক কন্ট্রোল এবং রিমুভ বাটন */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ backgroundColor: '#000', border: '1px solid #1a1a1a', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: product.stock_quantity > 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>
                STOCK: {product.stock_quantity}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => handleStockUpdate(product.id, product.stock_quantity, -1)} style={{ width: '24px', height: '24px', background: '#111', color: '#fff', border: '1px solid #333', cursor: 'pointer', fontSize: '10px' }}>-</button>
                <button onClick={() => handleStockUpdate(product.id, product.stock_quantity, 1)} style={{ width: '24px', height: '24px', background: '#111', color: '#fff', border: '1px solid #333', cursor: 'pointer', fontSize: '10px' }}>+</button>
              </div>
            </div>

            <button 
              onClick={() => handleDeleteProduct(product.id)} 
              style={{ backgroundColor: 'transparent', border: '1px solid #ef444455', color: '#ef4444', padding: '7px', fontSize: '10px', cursor: 'pointer', width: '100%', fontFamily: 'monospace', fontWeight: 'bold' }}
            >
              REMOVE PRODUCT
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', position: 'relative', fontFamily: 'monospace', paddingBottom: '40px', boxSizing: 'border-box' }}>
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          backgroundColor: '#0a0a0a', border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#ffffff'}`,
          color: '#ffffff', padding: '14px 20px', borderRadius: '2px', fontSize: '11px', letterSpacing: '1px'
        }}>
          <span style={{ color: notification.type === 'error' ? '#ef4444' : '#22c55e', marginRight: '8px' }}>
            {notification.type === 'error' ? '✕' : '✓'}
          </span>
          {notification.message}
        </div>
      )}

      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '11px 20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + ADD NEW PRODUCT
        </button>
      </div>

      {/* Advanced Filters & Search Bar */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input
          type="text"
          placeholder="SEARCH BY NAME, ID, OR CATEGORY..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '11px 15px', color: '#fff', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
        />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#888' }}>CATEGORY:</span>
            {categories.map(cat => {
              const isSelected = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  style={{
                    background: '#000',
                    color: '#fff',
                    border: isSelected ? '1px solid #fff' : '1px solid #333',
                    padding: '6px 10px', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: '#888' }}>STOCK:</span>
            {['ALL', 'IN_STOCK', 'OUT_OF_STOCK'].map(st => {
              const isSelected = stockFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStockFilter(st)}
                  style={{
                    background: '#000',
                    color: '#fff',
                    border: isSelected ? '1px solid #fff' : '1px solid #333',
                    padding: '6px 10px', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Rendering (Category-wise Horizontal Scroll) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>LOADING PRODUCTS...</div>
      ) : Object.keys(groupedProducts).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>NO PRODUCTS FOUND.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {Object.entries(groupedProducts).map(([categoryName, catProducts]) => {
            const isExpanded = !!expandedCategories[categoryName];
            return (
              <div key={categoryName} className="showroom-section" style={{ backgroundColor: '#030303', border: '1px solid #1a1a1a', padding: '15px' }}>
                
                {/* Category Header with See More / See Less */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#b3b3b3', letterSpacing: '3px', margin: 0, textTransform: 'uppercase' }}>
                    {categoryName} ({catProducts.length})
                  </h3>

                  <button 
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [categoryName]: !isExpanded }))} 
                    style={{ 
                      background: 'none', border: '1px solid #333', color: '#fff', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer',
                      display: 'flex', padding: '4px 10px', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <span>{isExpanded ? 'SEE LESS ▲' : 'SEE MORE ▼'}</span>
                  </button>
                </div>

                {/* Products Display Container */}
                <div className="showroom-row-container" style={{ display: 'flex', flexWrap: isExpanded ? 'wrap' : 'nowrap', width: '100%', scrollSnapType: 'x mandatory', overflowX: 'auto', scrollBehavior: 'smooth', gap: '15px' }}>
                  {catProducts.map((product) => (
                    <div key={product.id} style={{ minWidth: '260px', width: isExpanded ? 'calc(25% - 12px)' : '260px', flex: isExpanded ? '1 1 calc(25% - 12px)' : '0 0 auto' }}>
                      <AdminProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
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

              {/* Multiple Media Upload Section */}
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
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '5px' }}>DESCRIPTION</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', boxSizing: 'border-box' }} />
              </div>

              {/* Specifications (JSONB) */}
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

      <style>{`
        @keyframes swapFadeIn {
          from { opacity: 0; transform: translateY(1px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .showroom-row-container::-webkit-scrollbar {
          display: none;
        }
        .showroom-row-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AdminProducts;
