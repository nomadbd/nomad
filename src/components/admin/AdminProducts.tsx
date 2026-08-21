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

interface AdminProductsProps {
  showAddModal?: boolean;
  setShowAddModal?: React.Dispatch<React.SetStateAction<boolean>> | ((value: boolean) => void);
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  dateFormat?: string;
  isAddOpen?: boolean;
  onToggleAdd?: () => void;
  onCloseAdd?: () => void;
}

const ProductGallery = ({ images, productName }: { images: string[], productName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1/1' }}>
      {images.length > 0 ? (
        <img src={images[currentIndex]} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
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
                justify: 'center',
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
                justify: 'center',
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

const ProductCard = ({ product, onUpdateStock, onDelete }: { product: Product; onUpdateStock: any; onDelete: any }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const imagesList = (product.product_media && product.product_media.length > 0)
    ? product.product_media.map(m => m.media_url)
    : (product.image_url ? [product.image_url] : []);

  return (
    <div className="showroom-card-item" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px' }}>
      <ProductGallery images={imagesList} productName={product.name} />

      <div style={{ marginTop: '15px', padding: '0 15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 6px 0', fontWeight: '600' }}>{product.name}</h3>

        <div style={{ margin: '0 0 15px 0' }}>
          {(() => {
            const descriptionText = product.description || '';
            const characterLimit = 75;
            const isLongText = descriptionText.length > characterLimit;
            const displayedText = isLongText ? descriptionText.slice(0, characterLimit) + '...' : descriptionText;

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

const AdminProducts: React.FC<AdminProductsProps> = ({
  showAddModal: externalShowAddModal,
  setShowAddModal: externalSetShowAddModal,
  searchQuery = '',
  onSearchChange,
  isFilterOpen = false,
  isSearchOpen = false,
  dateFormat,
  isAddOpen,
  onToggleAdd,
  onCloseAdd
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sold_out'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('APPAREL');
  const [newDescription, setNewDescription] = useState<string>('');

  const [newFit, setNewFit] = useState<string>('Regular Fit');
  const [newGsm, setNewGsm] = useState<string>('180');
  const [newMadeIn, setNewMadeIn] = useState<string>('Bangladesh');
  const [newMaterial, setNewMaterial] = useState<string>('100% Premium Cotton');
  const [newSizes, setNewSizes] = useState<string>('S, M, L, XL');
  const [newColors, setNewColors] = useState<string>('BLACK, WHITE');

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isAddOpen !== undefined) {
      setShowAddModal(isAddOpen);
    } else if (externalShowAddModal !== undefined) {
      setShowAddModal(externalShowAddModal);
    }
  }, [isAddOpen, externalShowAddModal]);

  const handleSetShowAddModal = (value: boolean) => {
    setShowAddModal(value);
    if (externalSetShowAddModal) {
      externalSetShowAddModal(value);
    }
    if (!value && onCloseAdd) {
      onCloseAdd();
    }
  };

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
            product_media: sortedMedia || [],
            image_url: p.image_url
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
    e.target.value = '';
  };

  const removeSelectedMedia = (index: number) => {
    setMediaPreviews(prev => {
      if (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      return prev.filter((_, i) => i !== index);
    });
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    mediaPreviews.forEach(m => {
      if (m.url) URL.revokeObjectURL(m.url);
    });
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

      handleSetShowAddModal(false);
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

  const activeSearch = searchQuery || searchTerm;

  let filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
                          p.category?.toLowerCase().includes(activeSearch.toLowerCase());
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
    <div className="admin-products-container" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#000', minHeight: '100vh', padding: '0 20px 20px 20px', boxSizing: 'border-box' }}>
      {notification && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, backgroundColor: '#0a0a0a', border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#ffffff'}`, color: '#ffffff', padding: '14px 20px', borderRadius: '2px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px' }}>
          <span style={{ color: notification.type === 'error' ? '#ef4444' : '#22c55e', marginRight: '8px' }}>
            {notification.type === 'error' ? '✕' : '✓'}
          </span>
          {notification.message}
        </div>
      )}

      {(isFilterOpen || isSearchOpen) && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '10px', flexWrap: 'wrap', backgroundColor: '#080808', padding: '12px', border: '1px solid #1a1a1a', alignItems: 'center' }}>
          {isSearchOpen && (
            <input
              type="text"
              value={searchQuery || searchTerm}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                }
                setSearchTerm(e.target.value);
              }}
              placeholder="SEARCH PRODUCTS..."
              style={{ flex: 1, minWidth: '200px', backgroundColor: '#000', border: '1px solid #333', padding: '8px 12px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
            />
          )}
          {isFilterOpen && (
            <>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              >
                <option value="all">ALL STOCK STATUS</option>
                <option value="in_stock">IN STOCK ONLY</option>
                <option value="sold_out">SOLD OUT ONLY</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              >
                <option value="newest">SORT: NEWEST FIRST</option>
                <option value="price_low">PRICE: LOW TO HIGH</option>
                <option value="price_high">PRICE: HIGH TO LOW</option>
              </select>
            </>
          )}
        </div>
      )}

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
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        opacity: 0.7,
                        display: 'flex',
                        padding: 0,
                        alignItems: 'center',
                        minWidth: '85px',
                        justifyContent: 'flex-end',
                        whiteSpace: 'nowrap'
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
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUpdateStock={handleStockUpdate}
                        onDelete={handleDeleteProduct}
                      />
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
                <button type="button" onClick={() => handleSetShowAddModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #444', color: '#fff', padding: '10px', cursor: 'pointer' }}>CANCEL</button>
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
          .admin-products-container {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .showroom-section {
            width: 100%;
          }
          .showroom-card-item {
            width: 100% !important;
            min-width: 100% !important;
            padding: 0 0 15px 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
          }
        }
        @media (min-width: 768px) {
          .showroom-section {
            padding: 0;
          }
          .showroom-card-item {
            width: 300px;
            min-width: 300px;
            padding: 12px;
            margin-right: 15px;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminProducts;
