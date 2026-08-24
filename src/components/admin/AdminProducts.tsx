import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '../../cloudinary';
import './admin-animations.css';

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
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {images.length > 0 ? (
        <img src={images[currentIndex]} alt={productName} style={{ width: '100%', height: 'auto', display: 'block' }} />
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
                className="smooth-transition"
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

const ProductAdminActionRow = ({ product, onUpdateStock, onDelete, onEdit }: { product: Product; onUpdateStock: (id: string | number, currentStock: number, change: number) => void; onDelete: (id: string | number) => void; onEdit: (product: Product) => void }) => {
  const [step, setStep] = useState<'idle' | 'manage'>('idle');
  const isSoldOut = product.status === 'sold_out' || product.stock_quantity <= 0;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', marginTop: '10px', boxSizing: 'border-box', width: '100%' }}>
      {step === 'idle' && (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px' }}>
          <span style={{ fontSize: '14px', color: isSoldOut ? '#555' : '#fff', fontWeight: 500, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flexShrink: 1 }}>৳{product.price}</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setStep('manage')}
              className="smooth-transition"
              style={{
                height: '36px',
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                boxSizing: 'border-box',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '10px',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              STOCK ({product.stock_quantity})
            </button>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <button
                onClick={() => onEdit(product)}
                className="smooth-transition"
                style={{
                  height: '36px',
                  width: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  padding: 0,
                  lineHeight: 1,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#aaa',
                  fontSize: '13px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#aaa';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="smooth-transition"
                style={{
                  height: '36px',
                  width: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  padding: 0,
                  lineHeight: 1,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ff6666';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'manage' && (
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', backgroundColor: '#111', padding: '0 10px', borderRadius: '6px', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '11px', color: '#aaa', fontFamily: 'monospace' }}>STOCK: {product.stock_quantity}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => onUpdateStock(product.id, product.stock_quantity, -1)} className="smooth-transition" style={{ width: '24px', height: '24px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>-</button>
            <button onClick={() => onUpdateStock(product.id, product.stock_quantity, 1)} className="smooth-transition" style={{ width: '24px', height: '24px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
            <button onClick={() => setStep('idle')} className="smooth-transition" style={{ background: 'none', border: 'none', color: '#888', fontSize: '10px', cursor: 'pointer', marginLeft: '5px' }}>DONE</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onUpdateStock, onDelete, onEdit }: { product: Product; onUpdateStock: any; onDelete: any; onEdit: any }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const imagesList = (product.product_media && product.product_media.length > 0)
    ? product.product_media.map(m => m.media_url)
    : (product.image_url ? [product.image_url] : []);

  return (
    <div className="showroom-card-item animate-card smooth-transition" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px' }}>
      <ProductGallery images={imagesList} productName={product.name} />

      <div style={{ marginTop: '15px', padding: '0 15px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 6px 0', fontWeight: '600' }}>{product.name}</h3>

        <div style={{ margin: '0 0 10px 0' }}>
          {(() => {
            const descriptionText = product.description || '';
            const characterLimit = 75;
            const isLongText = descriptionText.length > characterLimit;
            const displayedText = isLongText ? descriptionText.slice(0, characterLimit) + '...' : descriptionText;

            return !isDescExpanded ? (
              <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                {displayedText || 'No description provided.'}
                <span
                  onClick={() => setIsDescExpanded(true)}
                  className="smooth-transition"
                  style={{ fontSize: '12px', color: '#fff', cursor: 'pointer', marginLeft: '6px', fontWeight: '500', display: 'inline' }}
                >
                  see more
                </span>
              </p>
            ) : (
              <div className="animate-fade-in">
                <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                  {descriptionText}
                </p>
                {product.details && Object.keys(product.details).length > 0 && (
                  <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {(() => {
                      const specKeys = [
                        'FIT',
                        'GSM',
                        'MATERIAL',
                        'COLOR',
                        'SLEEVE',
                        'PATTERN',
                        'OCCASION',
                        'CARE',
                        'MADE IN'
                      ];

                      const detailsObj = product.details || {};
                      const detailKeys = Object.keys(detailsObj);

                      const getVal = (targetKey: string) => {
                        const foundKey = detailKeys.find(
                          (k) =>
                            k.trim().toUpperCase() === targetKey ||
                            k.trim().toUpperCase().replace(/\s+/g, '') === targetKey.replace(/\s+/g, '')
                        );
                        return foundKey ? detailsObj[foundKey] : null;
                      };

                      const detailsVal = getVal('DETAILS');

                      return (
                        <>
                          {specKeys.map((key) => {
                            const val = getVal(key);
                            if (!val) return null;
                            return (
                              <div key={key} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                <span style={{ color: '#fff', width: '95px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</span>
                                <span style={{ color: '#555', marginRight: '10px', flexShrink: 0 }}>:</span>
                                <span style={{ color: '#ccc', fontWeight: '400', flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}>{String(val)}</span>
                              </div>
                            );
                          })}

                          {detailsVal && (
                            <div style={{ marginTop: '4px', color: '#ccc', fontWeight: '400', overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}>
                              {String(detailsVal)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                <span
                  onClick={() => setIsDescExpanded(false)}
                  className="smooth-transition"
                  style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', marginTop: '12px', display: 'inline-block', letterSpacing: '0.5px' }}
                >
                  see less
                </span>
              </div>
            );
          })()}
        </div>

        <ProductAdminActionRow product={product} onUpdateStock={onUpdateStock} onDelete={onDelete} onEdit={onEdit} />
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

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editStock, setEditStock] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editFit, setEditFit] = useState<string>('');
  const [editGsm, setEditGsm] = useState<string>('');
  const [editMadeIn, setEditMadeIn] = useState<string>('');
  const [editMaterial, setEditMaterial] = useState<string>('');
  const [editCare, setEditCare] = useState<string>('');
  const [editSleeve, setEditSleeve] = useState<string>('');
  const [editPattern, setEditPattern] = useState<string>('');
  const [editOccasion, setEditOccasion] = useState<string>('');
  const [editSizes, setEditSizes] = useState<string>('');
  const [editColors, setEditColors] = useState<string>('');
  const [editDetails, setEditDetails] = useState<string>('');
  const [editExistingMedia, setEditExistingMedia] = useState<{ id?: string | number; media_url: string; media_type: string }[]>([]);
  const [editMediaFiles, setEditMediaFiles] = useState<File[]>([]);
  const [editMediaPreviews, setEditMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sold_out'>('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [priceSort, setPriceSort] = useState<'none' | 'price_low' | 'price_high'>('none');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  const [newFit, setNewFit] = useState<string>('');
  const [newGsm, setNewGsm] = useState<string>('');
  const [newMadeIn, setNewMadeIn] = useState<string>('');
  const [newMaterial, setNewMaterial] = useState<string>('');
  const [newCare, setNewCare] = useState<string>('');
  const [newSleeve, setNewSleeve] = useState<string>('');
  const [newPattern, setNewPattern] = useState<string>('');
  const [newOccasion, setNewOccasion] = useState<string>('');
  const [newSizes, setNewSizes] = useState<string>('');
  const [newColors, setNewColors] = useState<string>('');
  const [newDetails, setNewDetails] = useState<string>('');

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
    setNewCategory('');
    setNewFit('');
    setNewGsm('');
    setNewMadeIn('');
    setNewMaterial('');
    setNewCare('');
    setNewSleeve('');
    setNewPattern('');
    setNewOccasion('');
    setNewSizes('');
    setNewColors('');
    setNewDetails('');
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 200 || val.length < newDescription.length) {
      setNewDescription(val);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      showNotification('PRODUCT NAME AND PRICE ARE REQUIRED.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const detailsJson: Record<string, string> = {};
      if (newFit) detailsJson['FIT'] = newFit;
      if (newGsm) detailsJson['GSM'] = newGsm;
      if (newMaterial) detailsJson['MATERIAL'] = newMaterial;
      if (newCare) detailsJson['CARE'] = newCare;
      if (newSleeve) detailsJson['SLEEVE'] = newSleeve;
      if (newPattern) detailsJson['PATTERN'] = newPattern;
      if (newOccasion) detailsJson['OCCASION'] = newOccasion;
      if (newMadeIn) detailsJson['MADE IN'] = newMadeIn;
      if (newDetails) detailsJson['DETAILS'] = newDetails;

      const sizesArray = newSizes.split(',').map(s => s.trim()).filter(Boolean);
      const colorsArray = newColors.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

      const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert([{
          name: newName,
          price: parseFloat(newPrice),
          stock_quantity: parseInt(newStock || '0', 10),
          category: newCategory || 'GENERAL',
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

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name || '');
    setEditPrice(product.price ? String(product.price) : '');
    setEditStock(product.stock_quantity !== undefined ? String(product.stock_quantity) : '0');
    setEditCategory(product.category || '');
    setEditDescription(product.description || '');

    const details = product.details || {};
    const getDetail = (key: string) => {
      const foundKey = Object.keys(details).find(
        k => k.trim().toUpperCase() === key || k.trim().toUpperCase().replace(/\s+/g, '') === key.replace(/\s+/g, '')
      );
      return foundKey ? details[foundKey] : '';
    };

    setEditFit(getDetail('FIT'));
    setEditGsm(getDetail('GSM'));
    setEditMadeIn(getDetail('MADE IN'));
    setEditMaterial(getDetail('MATERIAL'));
    setEditCare(getDetail('CARE'));
    setEditSleeve(getDetail('SLEEVE'));
    setEditPattern(getDetail('PATTERN'));
    setEditOccasion(getDetail('OCCASION'));
    setEditDetails(getDetail('DETAILS'));

    setEditSizes(product.sizes ? product.sizes.join(', ') : '');
    setEditColors(product.colors ? product.colors.join(', ') : '');
    setEditExistingMedia(product.product_media || []);
    setEditMediaFiles([]);
    setEditMediaPreviews([]);
  };

  const handleEditMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setEditMediaFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? ('video' as const) : ('image' as const)
      }));
      setEditMediaPreviews(prev => [...prev, ...newPreviews]);
    }
    e.target.value = '';
  };

  const removeSelectedEditMedia = (index: number) => {
    setEditMediaPreviews(prev => {
      if (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      return prev.filter((_, i) => i !== index);
    });
    setEditMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setEditExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 200 || val.length < editDescription.length) {
      setEditDescription(val);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName || !editPrice) {
      showNotification('PRODUCT NAME AND PRICE ARE REQUIRED.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const detailsJson: Record<string, string> = {};
      if (editFit) detailsJson['FIT'] = editFit;
      if (editGsm) detailsJson['GSM'] = editGsm;
      if (editMaterial) detailsJson['MATERIAL'] = editMaterial;
      if (editCare) detailsJson['CARE'] = editCare;
      if (editSleeve) detailsJson['SLEEVE'] = editSleeve;
      if (editPattern) detailsJson['PATTERN'] = editPattern;
      if (editOccasion) detailsJson['OCCASION'] = editOccasion;
      if (editMadeIn) detailsJson['MADE IN'] = editMadeIn;
      if (editDetails) detailsJson['DETAILS'] = editDetails;

      const sizesArray = editSizes.split(',').map(s => s.trim()).filter(Boolean);
      const colorsArray = editColors.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: editName,
          price: parseFloat(editPrice),
          stock_quantity: parseInt(editStock || '0', 10),
          category: editCategory || 'GENERAL',
          description: editDescription,
          details: detailsJson,
          sizes: sizesArray,
          colors: colorsArray
        })
        .eq('id', editingProduct.id);

      if (updateError) throw updateError;

      await supabase.from('product_media').delete().eq('product_id', editingProduct.id);

      for (let i = 0; i < editExistingMedia.length; i++) {
        await supabase.from('product_media').insert([{
          product_id: editingProduct.id,
          media_url: editExistingMedia[i].media_url,
          media_type: editExistingMedia[i].media_type,
          sort_order: i
        }]);
      }

      if (editMediaFiles.length > 0) {
        setUploadingMedia(true);
        const startOrder = editExistingMedia.length;
        for (let i = 0; i < editMediaFiles.length; i++) {
          const file = editMediaFiles[i];
          const mediaUrl = await uploadToCloudinary(file);
          const mediaType = file.type.startsWith('video') ? 'video' : 'image';

          await supabase.from('product_media').insert([{
            product_id: editingProduct.id,
            media_url: mediaUrl,
            media_type: mediaType,
            sort_order: startOrder + i
          }]);
        }
        setUploadingMedia(false);
      }

      setEditingProduct(null);
      fetchProducts();
      showNotification('PRODUCT UPDATED SUCCESSFULLY.');
    } catch (err: any) {
      console.error('Error updating product:', err);
      showNotification(err.message || 'FAILED TO UPDATE PRODUCT.', 'error');
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

  const handleDeleteProduct = (productId: string | number) => {
    const targetProduct = products.find(p => p.id === productId) || null;
    setDeletingProduct(targetProduct);
  };

  const handleSoftDeleteProduct = async () => {
    if (!deletingProduct) return;
    const productId = deletingProduct.id;
    setDeletingProduct(null);
    try {
      setProducts(prev => prev.filter(p => p.id !== productId));
      const { error } = await supabase.from('products').update({ status: 'archived' }).eq('id', productId);
      if (error) throw error;
      showNotification('PRODUCT HIDDEN FROM CATALOG.');
    } catch (err) {
      console.error('Failed to hide product:', err);
      showNotification('COULD NOT HIDE PRODUCT.', 'error');
      fetchProducts();
    }
  };

  const handleHardDeleteProduct = async () => {
    if (!deletingProduct) return;
    const productId = deletingProduct.id;
    const mediaList = deletingProduct.product_media || [];
    setDeletingProduct(null);
    try {
      setProducts(prev => prev.filter(p => p.id !== productId));

      if (mediaList.length > 0 && typeof deleteFromCloudinary === 'function') {
        for (const media of mediaList) {
          if (media.media_url) {
            try {
              await deleteFromCloudinary(media.media_url);
            } catch (e) {
              console.error('Failed to delete media from Cloudinary:', e);
            }
          }
        }
      }

      await supabase.from('product_media').delete().eq('product_id', productId);
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

      showNotification('PRODUCT PERMANENTLY DELETED FROM DATABASE & CLOUDINARY.');
    } catch (err) {
      console.error('Failed to delete product:', err);
      showNotification('COULD NOT DELETE PRODUCT.', 'error');
      fetchProducts();
    }
  };

  const activeSearch = searchQuery || searchTerm;

  let filteredProducts = products.filter(p => {
    if (p.status === 'archived' || p.status === 'hidden') return false;

    const matchesSearch = p.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
                          p.category?.toLowerCase().includes(activeSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (stockFilter === 'in_stock' && p.stock_quantity <= 0) return false;
    if (stockFilter === 'sold_out' && p.stock_quantity > 0) return false;

    const hasMin = minPrice !== '' && !isNaN(parseFloat(minPrice));
    const hasMax = maxPrice !== '' && !isNaN(parseFloat(maxPrice));

    if (hasMin && hasMax) {
      if (p.price < parseFloat(minPrice) || p.price > parseFloat(maxPrice)) return false;
    } else if (hasMin) {
      if (p.price !== parseFloat(minPrice)) return false;
    } else if (hasMax) {
      if (p.price !== parseFloat(maxPrice)) return false;
    }

    const hasStart = startDate !== '';
    const hasEnd = endDate !== '';
    const pTime = new Date(p.created_at).getTime();

    if (hasStart && hasEnd) {
      const sTime = new Date(`${startDate}T00:00:00`).getTime();
      const eTime = new Date(`${endDate}T23:59:59.999`).getTime();
      if (pTime < sTime || pTime > eTime) return false;
    } else if (hasStart) {
      const sTime = new Date(`${startDate}T00:00:00`).getTime();
      const eTime = new Date(`${startDate}T23:59:59.999`).getTime();
      if (pTime < sTime || pTime > eTime) return false;
    } else if (hasEnd) {
      const sTime = new Date(`${endDate}T00:00:00`).getTime();
      const eTime = new Date(`${endDate}T23:59:59.999`).getTime();
      if (pTime < sTime || pTime > eTime) return false;
    }

    return true;
  });

  filteredProducts.sort((a, b) => {
    if (a.stock_quantity !== b.stock_quantity) {
      return a.stock_quantity - b.stock_quantity;
    }

    if (priceSort === 'price_low') {
      if (a.price !== b.price) return a.price - b.price;
    } else if (priceSort === 'price_high') {
      if (a.price !== b.price) return b.price - a.price;
    }

    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (dateSort === 'oldest') {
      return timeA - timeB;
    } else {
      return timeB - timeA;
    }
  });

  const filteredCategories = Array.from(new Set(filteredProducts.map(p => p.category)));

  return (
    <div className="admin-products-container animate-fade-in" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#000', minHeight: '100vh', padding: '0 20px 20px 20px', boxSizing: 'border-box' }}>
      {notification && createPortal(
        <div
          className="animate-pop"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10001,
            backgroundColor: '#0d0d0d',
            border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
            boxShadow: notification.type === 'error'
              ? '0 10px 30px rgba(239, 68, 68, 0.15)'
              : '0 10px 30px rgba(34, 197, 94, 0.15)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            color: notification.type === 'error' ? '#ef4444' : '#22c55e',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: 0,
            lineHeight: 1
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{notification.type === 'error' ? '✕' : '✓'}</span>
          </span>
          <span>{notification.message}</span>
        </div>,
        document.body
      )}

      <div className={`filter-expand-wrapper ${isFilterOpen || isSearchOpen ? 'open' : ''}`}>
        <div className="filter-expand-content">
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px', marginTop: '10px', backgroundColor: '#080808', padding: '16px', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
            <div className={`search-filter-sub-wrapper ${isSearchOpen ? 'open' : ''}`}>
              <div className="search-filter-sub-inner">
                <div style={{ paddingBottom: isFilterOpen ? '16px' : '0px', transition: 'padding 0.35s ease' }}>
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
                    className="smooth-transition animate-fade-in"
                    style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', borderRadius: '25px', padding: '8px 16px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className={`search-filter-sub-wrapper ${isFilterOpen ? 'open' : ''}`}>
              <div className="search-filter-sub-inner">
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#777', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '8px' }}>STOCK STATUS</div>
                    <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
                      {[
                        { label: 'ALL', value: 'all' },
                        { label: 'IN STOCK', value: 'in_stock' },
                        { label: 'SOLD OUT', value: 'sold_out' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setStockFilter(item.value as any)}
                          className="smooth-transition"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0',
                            color: stockFilter === item.value ? '#fff' : '#666',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            fontWeight: stockFilter === item.value ? '700' : 'normal',
                            textDecoration: 'none',
                            flexShrink: 0
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#777', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '8px' }}>SORT</div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
                      <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
                        {[
                          { label: 'NEWEST FIRST', value: 'newest' },
                          { label: 'OLDEST FIRST', value: 'oldest' }
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setDateSort(item.value as any)}
                            className="smooth-transition"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '0',
                              color: dateSort === item.value ? '#fff' : '#666',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              fontWeight: dateSort === item.value ? '700' : 'normal',
                              textDecoration: 'none',
                              flexShrink: 0
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="smooth-transition"
                          style={{ backgroundColor: '#000', border: '1px solid #333', color: '#aaa', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
                        />
                        <span style={{ color: '#555', fontSize: '10px' }}>-</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="smooth-transition"
                          style={{ backgroundColor: '#000', border: '1px solid #333', color: '#aaa', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#777', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '8px' }}>PRICE</div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
                      <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
                        {[
                          { label: 'HIGH TO LOW', value: 'price_high' },
                          { label: 'LOW TO HIGH', value: 'price_low' }
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setPriceSort(priceSort === item.value ? 'none' : item.value as any)}
                            className="smooth-transition"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '0',
                              color: priceSort === item.value ? '#fff' : '#666',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              fontWeight: priceSort === item.value ? '700' : 'normal',
                              textDecoration: 'none',
                              flexShrink: 0
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <input
                          type="number"
                          placeholder="MIN"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="smooth-transition"
                          style={{ width: '60px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
                        />
                        <span style={{ color: '#555', fontSize: '10px' }}>-</span>
                        <input
                          type="number"
                          placeholder="MAX"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="smooth-transition"
                          style={{ width: '60px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                <div key={category} className="showroom-section animate-fade-in" style={{ marginBottom: '50px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px 12px 15px', borderBottom: '1px solid #141414' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase' }}>{category}</h3>
                    <button
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                      className="smooth-transition"
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
                        onEdit={handleOpenEdit}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {deletingProduct && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="animate-pop" style={{ backgroundColor: '#050505', border: '1px solid #262626', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <h4 style={{ color: '#fff', fontSize: '13px', margin: '0 0 10px 0', letterSpacing: '1px', textTransform: 'uppercase' }}>REMOVE PRODUCT</h4>
            <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 20px 0', lineHeight: '1.5' }}>Choose how you want to handle this product deletion:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleSoftDeleteProduct} className="smooth-transition" style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>HIDE FROM CATALOG (KEEP DATA & MEDIA)</button>
              <button onClick={handleHardDeleteProduct} className="smooth-transition" style={{ width: '100%', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>PERMANENT DELETE (SUPABASE & CLOUDINARY)</button>
              <button onClick={() => setDeletingProduct(null)} className="smooth-transition" style={{ width: '100%', background: 'transparent', border: 'none', color: '#888', padding: '8px', fontSize: '11px', cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingProduct && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="animate-pop" style={{ backgroundColor: '#050505', border: '1px solid #262626', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ color: '#fff', fontSize: '13px', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>EDIT PRODUCT</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="smooth-transition"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: '#aaa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  padding: 0,
                  lineHeight: 1,
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#aaa';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', border: '1px dashed #333', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#000', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span style={{ fontSize: '9px', color: '#888', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Upload</span>
                  <input type="file" multiple accept="image/*,video/*" onChange={handleEditMediaChange} style={{ display: 'none' }} />
                </label>
                <div style={{ flex: '1 1 140px' }}>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Category (e.g. APPAREL)"
                    className="minimal-input"
                  />
                </div>
              </div>

              {(editExistingMedia.length > 0 || editMediaPreviews.length > 0) && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '-6px' }}>
                  {editExistingMedia.map((media, idx) => (
                    <div key={`existing-${idx}`} style={{ position: 'relative', width: '50px', height: '50px', border: '1px solid #333', borderRadius: '6px', backgroundColor: '#000', overflow: 'visible' }}>
                      {media.media_type === 'video' ? (
                        <video src={media.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                      ) : (
                        <img src={media.media_url} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(idx)}
                        className="smooth-transition"
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          padding: 0,
                          lineHeight: 1,
                          fontWeight: 'bold'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
                      </button>
                    </div>
                  ))}

                  {editMediaPreviews.map((media, idx) => (
                    <div key={`new-${idx}`} style={{ position: 'relative', width: '50px', height: '50px', border: '1px solid #333', borderRadius: '6px', backgroundColor: '#000', overflow: 'visible' }}>
                      {media.type === 'video' ? (
                        <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                      ) : (
                        <img src={media.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                      )}
                      <button
                        type="button"
                        onClick={() => removeSelectedEditMedia(idx)}
                        className="smooth-transition"
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          padding: 0,
                          lineHeight: 1,
                          fontWeight: 'bold'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Product Name *"
                  className="minimal-input"
                />
              </div>

              <div>
                <textarea
                  value={editDescription}
                  onChange={handleEditDescriptionChange}
                  placeholder="Description (Bio)"
                  rows={2}
                  className="minimal-input"
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Price (৳) *"
                  className="minimal-input"
                  style={{ flex: '1 1 130px' }}
                />
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  placeholder="Stock Quantity"
                  className="minimal-input"
                  style={{ flex: '1 1 130px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px 15px' }}>
                <input type="text" value={editFit} onChange={(e) => setEditFit(e.target.value)} placeholder="Fit (e.g. Regular Fit)" className="minimal-input" />
                <input type="text" value={editGsm} onChange={(e) => setEditGsm(e.target.value)} placeholder="GSM (e.g. 180)" className="minimal-input" />
                <input type="text" value={editSizes} onChange={(e) => setEditSizes(e.target.value)} placeholder="Sizes (e.g. S, M, L, XL)" className="minimal-input" />
                <input type="text" value={editColors} onChange={(e) => setEditColors(e.target.value)} placeholder="Colors (e.g. BLACK, WHITE)" className="minimal-input" />
                <input type="text" value={editMaterial} onChange={(e) => setEditMaterial(e.target.value)} placeholder="Material (e.g. 100% Cotton)" className="minimal-input" />
                <input type="text" value={editCare} onChange={(e) => setEditCare(e.target.value)} placeholder="Care (e.g. Machine Wash)" className="minimal-input" />
                <input type="text" value={editSleeve} onChange={(e) => setEditSleeve(e.target.value)} placeholder="Sleeve (e.g. Half Sleeve)" className="minimal-input" />
                <input type="text" value={editPattern} onChange={(e) => setEditPattern(e.target.value)} placeholder="Pattern (e.g. Solid)" className="minimal-input" />
                <input type="text" value={editOccasion} onChange={(e) => setEditOccasion(e.target.value)} placeholder="Occasion (e.g. Casual)" className="minimal-input" />
                <input type="text" value={editMadeIn} onChange={(e) => setEditMadeIn(e.target.value)} placeholder="Made In (e.g. Bangladesh)" className="minimal-input" />
              </div>

              <div>
                <textarea
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  placeholder="Details (Product Details)"
                  rows={3}
                  className="minimal-input"
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="smooth-transition"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#aaa',
                    padding: '10px',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingMedia}
                  className="smooth-transition"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '10px',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {uploadingMedia ? 'UPLOADING MEDIA...' : submitting ? 'SAVING...' : 'UPDATE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showAddModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="animate-pop" style={{ backgroundColor: '#050505', border: '1px solid #262626', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ color: '#fff', fontSize: '13px', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>ADD NEW PRODUCT</h3>
              <button
                type="button"
                onClick={() => handleSetShowAddModal(false)}
                className="smooth-transition"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: '#aaa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  padding: 0,
                  lineHeight: 1,
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#aaa';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', border: '1px dashed #333', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#000', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span style={{ fontSize: '9px', color: '#888', marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Upload</span>
                  <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} style={{ display: 'none' }} />
                </label>
                <div style={{ flex: '1 1 140px' }}>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Category (e.g. APPAREL)"
                    className="minimal-input"
                  />
                </div>
              </div>

              {mediaPreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '-6px' }}>
                  {mediaPreviews.map((media, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '50px', height: '50px', border: '1px solid #333', borderRadius: '6px', backgroundColor: '#000', overflow: 'visible' }}>
                      {media.type === 'video' ? (
                        <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                      ) : (
                        <img src={media.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px' }} />
                      )}
                      <button
                        type="button"
                        onClick={() => removeSelectedMedia(idx)}
                        className="smooth-transition"
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          padding: 0,
                          lineHeight: 1,
                          fontWeight: 'bold'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Product Name *"
                  className="minimal-input"
                />
              </div>

              <div>
                <textarea
                  value={newDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Description (Bio)"
                  rows={2}
                  className="minimal-input"
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price (৳) *"
                  className="minimal-input"
                  style={{ flex: '1 1 130px' }}
                />
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Stock Quantity"
                  className="minimal-input"
                  style={{ flex: '1 1 130px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px 15px' }}>
                <input type="text" value={newFit} onChange={(e) => setNewFit(e.target.value)} placeholder="Fit (e.g. Regular Fit)" className="minimal-input" />
                <input type="text" value={newGsm} onChange={(e) => setNewGsm(e.target.value)} placeholder="GSM (e.g. 180)" className="minimal-input" />
                <input type="text" value={newSizes} onChange={(e) => setNewSizes(e.target.value)} placeholder="Sizes (e.g. S, M, L, XL)" className="minimal-input" />
                <input type="text" value={newColors} onChange={(e) => setNewColors(e.target.value)} placeholder="Colors (e.g. BLACK, WHITE)" className="minimal-input" />
                <input type="text" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} placeholder="Material (e.g. 100% Cotton)" className="minimal-input" />
                <input type="text" value={newCare} onChange={(e) => setNewCare(e.target.value)} placeholder="Care (e.g. Machine Wash)" className="minimal-input" />
                <input type="text" value={newSleeve} onChange={(e) => setNewSleeve(e.target.value)} placeholder="Sleeve (e.g. Half Sleeve)" className="minimal-input" />
                <input type="text" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} placeholder="Pattern (e.g. Solid)" className="minimal-input" />
                <input type="text" value={newOccasion} onChange={(e) => setNewOccasion(e.target.value)} placeholder="Occasion (e.g. Casual)" className="minimal-input" />
                <input type="text" value={newMadeIn} onChange={(e) => setNewMadeIn(e.target.value)} placeholder="Made In (e.g. Bangladesh)" className="minimal-input" />
              </div>

              <div>
                <textarea
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Details (Product Details)"
                  rows={3}
                  className="minimal-input"
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleSetShowAddModal(false)}
                  className="smooth-transition"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#aaa',
                    padding: '10px',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingMedia}
                  className="smooth-transition"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '10px',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {uploadingMedia ? 'UPLOADING MEDIA...' : submitting ? 'SAVING...' : 'CREATE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes swapFadeIn {
          from { opacity: 0; transform: translateY(1px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .minimal-input {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #262626 !important;
          color: #fff !important;
          font-size: 11px !important;
          outline: none !important;
          padding: 8px 0 !important;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
          font-family: inherit;
        }
        .minimal-input:focus {
          border-bottom-color: #555 !important;
        }
        .minimal-input::placeholder {
          color: #555;
        }
        .filter-expand-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .filter-expand-wrapper.open {
          grid-template-rows: 1fr;
        }
        .filter-expand-content {
          min-height: 0;
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
          opacity: 0;
          transform: translateY(-8px);
          overflow: hidden;
        }
        .filter-expand-wrapper.open .filter-expand-content {
          opacity: 1;
          transform: translateY(0);
        }
        .search-filter-sub-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
          overflow: hidden;
        }
        .search-filter-sub-wrapper.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .search-filter-sub-inner {
          min-height: 0;
          overflow: hidden;
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
