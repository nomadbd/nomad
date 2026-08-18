import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { uploadToCloudinary } from '../../cloudinary';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  status: 'active' | 'sold_out' | string;
  sizes: string[];  
  colors: string[]; 
  created_at: string;
  product_media: { media_url: string; media_type: string; sort_order?: number }[];
  details?: Record<string, string> | null;
  image_url?: string;
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
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {images.length > 0 ? (
        <img 
          src={images[currentIndex]} 
          alt={productName} 
          style={{ width: '100%', height: 'auto', maxHeight: '450px', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>No Image</div>
      )}

      {images.length > 1 && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handlePrev} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handleNext} />

          <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 2 }}>
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

// 🛒 অ্যাকশন রো
const ProductAdminActionRow = ({ product, onUpdateStock, onDelete }: { product: Product; onUpdateStock: (id: string | number, currentStock: number, change: number) => void; onDelete: (id: string | number) => void }) => {
  const [step, setStep] = useState<'idle' | 'manage'>('idle');
  const isSoldOut = product.status === 'sold_out' || product.stock_quantity <= 0;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', marginTop: 'auto', boxSizing: 'border-box', width: '100%' }}>
      {step === 'idle' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', animation: 'swapFadeIn 0.25s ease-in-out' }}>
          <span style={{ fontSize: '15px', color: isSoldOut ? '#555' : '#fff', fontWeight: 500, fontFamily: 'monospace' }}>৳{product.price}</span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setStep('manage')}
              style={{
                height: '36px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                background: 'transparent',
                border: '1px solid #333',
                color: '#fff',
                fontSize: '10px',
                letterSpacing: '1px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: '600',
              }}
            >
              STOCK ({product.stock_quantity})
            </button>
            <button
              onClick={() => onDelete(product.id)}
              style={{
                height: '36px',
                width: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid #ef444455',
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {step === 'manage' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', animation: 'swapFadeIn 0.25s ease-in-out', backgroundColor: '#111', padding: '0 10px', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '11px', color: '#aaa', fontFamily: 'monospace' }}>STOCK: {product.stock_quantity}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => onUpdateStock(product.id, product.stock_quantity, -1)} style={{ width: '24px', height: '24px', background: '#222', color: '#fff', border: 'none', cursor: 'pointer' }}>-</button>
            <button onClick={() => onUpdateStock(product.id, product.stock_quantity, 1)} style={{ width: '24px', height: '24px', background: '#222', color: '#fff', border: 'none', cursor: 'pointer' }}>+</button>
            <button onClick={() => setStep('idle')} style={{ background: 'none', border: 'none', color: '#888', fontSize: '10px', cursor: 'pointer', marginLeft: '5px' }}>DONE</button>
          </div>
        </div>
      )}
    </div>
  );
};

// 💳 ইনডিভিজুয়াল প্রোডাক্ট কার্ড কম্পোনেন্ট
const ProductCard = ({ product, onUpdateStock, onDelete }: { product: Product; onUpdateStock: any; onDelete: any }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  return (
    <div className="showroom-card-item" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px' }}>
      <ProductGallery 
        images={product.product_media?.map(m => m.media_url) || []} 
        productName={product.name} 
      />

      <div style={{ marginTop: '15px', padding: '0 5px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 6px 0', fontWeight: '600' }}>{product.name}</h3>

        <div style={{ margin: '0 0 15px 0' }}>
          {(() => {
            const descriptionText = product.description || '';
            const characterLimit = 75; 
            const isLongText = descriptionText.length > characterLimit;
            const displayedText = isLongText 
              ? descriptionText.slice(0, characterLimit) + '...' 
              : descriptionText;

            return !isDescExpanded ? (
              <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                {displayedText || 'No description provided.'}
                {isLongText && (
                  <span 
                    onClick={() => setIsDescExpanded(true)}
                    style={{ fontSize: '12px', color: '#fff', cursor: 'pointer', marginLeft: '6px', fontWeight: '500', display: 'inline' }}
                  >
                    see more
                  </span>
                )}
              </p>
            ) : (
              <div style={{ animation: 'swapFadeIn 0.3s ease-in-out' }}>
                <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                  {descriptionText}
                </p>

                {product.details && Object.keys(product.details).length > 0 && (
                  <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {Object.entries(product.details).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                        <span style={{ color: '#fff', width: '95px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</span>
                        <span style={{ color: '#555', marginRight: '10px', flexShrink: 0 }}>:</span>
                        <span style={{ color: '#ccc', fontWeight: '400', flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <span 
                  onClick={() => setIsDescExpanded(false)}
                  style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', marginTop: '12px', display: 'inline-block', letterSpacing: '0.5px' }}
                >
                  see less
                </span>
              </div>
            );
          })()}
        </div>

        <ProductAdminActionRow product={product} onUpdateStock={onUpdateStock} onDelete={onDelete} />
      </div>
    </div>
  );
};

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Filter Dropdown Toggle State
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Scroll direction state for smart sticky header
  const [isVisibleHeader, setIsVisibleHeader] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sold_out'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

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

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Smart Header Scroll Listener (Improved threshold & sensitivity)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // সামান্য উপরে স্ক্রল করলেই (যেমন: ৫ পিক্সেল বা তার বেশি) হেডার দৃশ্যমান হবে
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisibleHeader(false); // নিচের দিকে স্ক্রল করলে হাইড হবে
        setShowFilters(false);     
      } else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
        setIsVisibleHeader(true);  // ওপরের দিকে স্ক্রল করলেই সাথে সাথে শো করবে
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
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
          const sortedMedia = p.product_media?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            details: p.details || {},
            sizes: p.sizes || [],
            colors: p.colors || [],
            price: p.price,
            stock_quantity: p.stock_quantity ?? 0,
            status: p.status || 'active',
            category: p.category || 'GENERAL',
            created_at: p.created_at,
            product_media: sortedMedia || []
          };
        });

        setProducts(formatted);
        const uniqueCategories = Array.from(new Set(formatted.map((p: Product) => p.category)));
        setCategories(uniqueCategories);
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
          category: newCategory,
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

  // Filtering and Sorting Logic
  let filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (stockFilter === 'in_stock') return matchesSearch && p.stock_quantity > 0;
    if (stockFilter === 'sold_out') return matchesSearch && p.stock_quantity <= 0;
    return matchesSearch;
  });

  if (sortBy === 'price_low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else {
    filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const filteredCategories = Array.from(new Set(filteredProducts.map(p => p.category)));

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', position: 'relative', backgroundColor: '#000', minHeight: '100vh', padding: '20px', boxSizing: 'border-box' }}>
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

      {/* Sticky Smart Header Bar (z-index কমিয়ে দেয়া হয়েছে যাতে মেইন মেনু ওপেন হলে এর নিচে ঢাকা থাকে) */}
      <div style={{
        position: 'sticky',
        top: '0',
        zIndex: 10, 
        backgroundColor: '#000',
        paddingBottom: '15px',
        transition: 'transform 0.3s ease-in-out',
        transform: isVisibleHeader ? 'translateY(0)' : 'translateY(-120%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#050505', border: '1px solid #ffffff', borderRadius: '30px', padding: '6px 12px 6px 15px', boxSizing: 'border-box' }}>
          <input
            type="text"
            placeholder="SEARCH PRODUCTS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', padding: '4px 0', color: '#fff', fontSize: '11px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Filter Toggle Icon Button */}
            <button
              onClick={() => setShowFilters(prev => !prev)}
              title="Toggle Filters"
              style={{ 
                backgroundColor: showFilters ? '#222' : 'transparent', 
                color: '#fff', 
                border: 'none', 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                boxSizing: 'border-box' 
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>

            {/* Add Product Button */}
            <button
              onClick={() => setShowAddModal(true)}
              title="Add New Product"
              style={{ 
                backgroundColor: 'transparent', 
                color: '#fff', 
                border: 'none', 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                boxSizing: 'border-box' 
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Panel */}
        {showFilters && (
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff', padding: '12px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box', animation: 'swapFadeIn 0.2s ease-in-out' }}>
            {/* Stock Filters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'ALL STOCK' },
                { id: 'in_stock', label: 'IN STOCK' },
                { id: 'sold_out', label: 'SOLD OUT' }
              ].map(item => {
                const isSelected = stockFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setStockFilter(item.id as any)}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      backgroundColor: '#000',
                      border: `1px solid ${isSelected ? '#fff' : '#444'}`,
                      color: isSelected ? '#fff' : '#888',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Sort Filters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'newest', label: 'NEWEST' },
                { id: 'price_low', label: 'PRICE: LOW' },
                { id: 'price_high', label: 'PRICE: HIGH' }
              ].map(item => {
                const isSelected = sortBy === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSortBy(item.id as any)}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      backgroundColor: '#000',
                      border: `1px solid ${isSelected ? '#fff' : '#444'}`,
                      color: isSelected ? '#fff' : '#888',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>LOADING PRODUCTS...</div>
      ) : (
        <div style={{ marginTop: '10px' }}>
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#555', fontSize: '11px', fontFamily: 'monospace' }}>NO PRODUCTS FOUND</div>
          ) : (
            filteredCategories.map((category) => {
              const categoryProducts = filteredProducts.filter(p => p.category === category);
              const isExpanded = !!expandedCategories[category];

              return (
                <div key={category} className="showroom-section" style={{ marginBottom: '50px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px 12px 15px', borderBottom: '1px solid #141414' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase' }}>{category}</h3>

                    <button 
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))} 
                      style={{ 
                        background: 'none', border: 'none', color: '#fff', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', opacity: 0.7,
                        display: 'flex', padding: 0, alignItems: 'center', minWidth: '85px', justifyContent: 'flex-end', whiteSpace: 'nowrap'
                      }}
                    >
                      <span>SEE&nbsp;</span>
                      <span style={{ display: 'inline-block', width: '35px', textAlign: 'left' }}>
                        {isExpanded ? 'LESS' : 'MORE'}
                      </span>
                    </button>
                  </div>

                  <div className="showroom-row-container" style={{ display: 'flex', flexWrap: isExpanded ? 'wrap' : 'nowrap', width: '100%', scrollSnapType: 'x mandatory', overflowX: 'auto', scrollBehavior: 'smooth' }}>
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onUpdateStock={handleStockUpdate} onDelete={handleDeleteProduct} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
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
        @media (max-width: 767px) {
          .showroom-section { margin-left: calc(-20px); margin-right: calc(-20px); width: calc(100vw); }
          .showroom-card-item { width: 100vw !important; min-width: 100vw !important; padding: 0 15px !important; }
        }
        @media (min-width: 768px) {
          .showroom-section { padding: 0; }
          .showroom-card-item { width: 300px; min-width: 300px; padding: 12px; margin-right: 15px; margin-bottom: 20px; }
        }
      `}</style>
    </div>
  );
};

export default AdminProducts;
