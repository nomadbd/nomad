Import React, { useState, useEffect } from 'react';
Import { createPortal } from 'react-dom';
Import { supabase } from '../../supabaseClient';
Import { uploadToCloudinary, deleteFromCloudinary } from '../../cloudinary';
Import './admin-animations.css';

Interface Product {
  Id: string | number;
  Name: string;
  Description: string;
  Price: number;
  Category: string;
  Stock_quantity: number;
  Status: 'active' | 'sold_out' | string;
  Sizes: string[];
  Colors: string[];
  Created_at: string;
  Product_media: { media_url: string; media_type: string; sort_order?: number }[];
  Details?: Record<string, string> | null;
  Image_url?: string;
}

Interface AdminProductsProps {
  ShowAddModal?: boolean;
  SetShowAddModal?: React.Dispatch<React.SetStateAction<boolean>> | ((value: boolean) => void);
  SearchQuery?: string;
  OnSearchChange?: (query: string) => void;
  IsFilterOpen?: boolean;
  IsSearchOpen?: boolean;
  DateFormat?: string;
  IsAddOpen?: boolean;
  OnToggleAdd?: () => void;
  OnCloseAdd?: () => void;
}

// হেল্পার ফাংশন: বিস্তারিত এরর মেসেজ বের করার জন্য
Const getErrorMessage = (err: any): string => {
  If (!err) return 'UNKNOWN ERROR';
  If (typeof err === 'string') return err;
  
  Let msg = err.message || err.error_description || err.msg || 'AN UNEXPECTED ERROR OCCURRED';
  If (err.details) msg += ` | Details: ${err.details}`;
  If (err.hint) msg += ` | Hint: ${err.hint}`;
  If (err.code) msg += ` (Code: ${err.code})`;
  
  Return msg;
};

Const ProductGallery = ({ images, productName }: { images: string[], productName: string }) => {
  Const [currentIndex, setCurrentIndex] = useState(0);

  UseEffect(() => {
    SetCurrentIndex(0);
  }, [images]);

  Const handlePrev = (e: React.MouseEvent) => {
    E.stopPropagation();
    SetCurrentIndex(prev => (prev > 0 ? Prev - 1 : images.length - 1));
  };

  Const handleNext = (e: React.MouseEvent) => {
    E.stopPropagation();
    SetCurrentIndex(prev => (prev < images.length - 1 ? Prev + 1 : 0));
  };

  Return (
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
                Key={idx}
                ClassName="smooth-transition"
                Style={{
                  Width: '6px',
                  Height: '6px',
                  BorderRadius: '50%',
                  Background: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

Const ProductAdminActionRow = ({ product, onUpdateStock, onDelete, onEdit }: { product: Product; onUpdateStock: (id: string | number, currentStock: number, change: number) => void; onDelete: (id: string | number) => void; onEdit: (product: Product) => void }) => {
  Const [step, setStep] = useState<'idle' | 'manage'>('idle');
  Const isSoldOut = product.status === 'sold_out' || product.stock_quantity <= 0;

  Return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', marginTop: '10px', boxSizing: 'border-box', width: '100%' }}>
      {step === 'idle' && (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px' }}>
          <span style={{ fontSize: '14px', color: isSoldOut ? '#555' : '#fff', fontWeight: 500, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flexShrink: 1 }}>৳{product.price}</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
            <button
              OnClick={() => setStep('manage')}
              ClassName="smooth-transition"
              Style={{
                Height: '36px',
                Padding: '0 4px',
                Display: 'flex',
                AlignItems: 'center',
                JustifyContent: 'center',
                BoxSizing: 'border-box',
                Background: 'transparent',
                Border: 'none',
                BorderRadius: '6px',
                Color: '#fff',
                FontSize: '10px',
                LetterSpacing: '0.5px',
                Cursor: 'pointer',
                TextTransform: 'uppercase',
                FontWeight: '600',
                WhiteSpace: 'nowrap',
                FlexShrink: 0
              }}
            >
              STOCK ({product.stock_quantity})
            </button>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <button
                OnClick={() => onEdit(product)}
                ClassName="smooth-transition"
                Style={{
                  Height: '36px',
                  Width: '28px',
                  Display: 'flex',
                  AlignItems: 'center',
                  JustifyContent: 'center',
                  Padding: 0,
                  LineHeight: 1,
                  Background: 'transparent',
                  Border: 'none',
                  BorderRadius: '6px',
                  Color: '#aaa',
                  FontSize: '13px',
                  Cursor: 'pointer',
                  FlexShrink: 0
                }}
                OnMouseEnter={(e) => {
                  E.currentTarget.style.color = '#ffffff';
                }}
                OnMouseLeave={(e) => {
                  E.currentTarget.style.color = '#aaa';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                OnClick={() => onDelete(product.id)}
                ClassName="smooth-transition"
                Style={{
                  Height: '36px',
                  Width: '28px',
                  Display: 'flex',
                  AlignItems: 'center',
                  JustifyContent: 'center',
                  Padding: 0,
                  LineHeight: 1,
                  Background: 'transparent',
                  Border: 'none',
                  BorderRadius: '6px',
                  Color: '#ef4444',
                  FontSize: '13px',
                  Cursor: 'pointer',
                  FontWeight: 'bold',
                  FlexShrink: 0
                }}
                OnMouseEnter={(e) => {
                  E.currentTarget.style.color = '#ff6666';
                }}
                OnMouseLeave={(e) => {
                  E.currentTarget.style.color = '#ef4444';
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

Const ProductCard = ({ product, onUpdateStock, onDelete, onEdit }: { product: Product; onUpdateStock: any; onDelete: any; onEdit: any }) => {
  Const [isDescExpanded, setIsDescExpanded] = useState(false);

  Const imagesList = (product.product_media && product.product_media.length > 0)
    ? Product.product_media.map(m => m.media_url)
    : (product.image_url ? [product.image_url] : []);

  Return (
    <div className="showroom-card-item animate-card smooth-transition" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px' }}>
      <ProductGallery images={imagesList} productName={product.name} />

      <div style={{ marginTop: '15px', padding: '0 15px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 6px 0', fontWeight: '600' }}>{product.name}</h3>

        <div style={{ margin: '0 0 10px 0' }}>
          {(() => {
            Const descriptionText = product.description || '';
            Const characterLimit = 75;
            Const isLongText = descriptionText.length > characterLimit;
            Const displayedText = isLongText ? DescriptionText.slice(0, characterLimit) + '...' : descriptionText;

            Return !isDescExpanded ? (
              <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                {displayedText || 'No description provided.'}
                <span
                  OnClick={() => setIsDescExpanded(true)}
                  ClassName="smooth-transition"
                  Style={{ fontSize: '12px', color: '#fff', cursor: 'pointer', marginLeft: '6px', fontWeight: '500', display: 'inline' }}
                >
                  See more
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
                      Const specKeys = [
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

                      Const detailsObj = product.details || {};
                      Const detailKeys = Object.keys(detailsObj);

                      Const getVal = (targetKey: string) => {
                        Const foundKey = detailKeys.find(
                          (k) =>
                            K.trim().toUpperCase() === targetKey ||
                            K.trim().toUpperCase().replace(/\s+/g, '') === targetKey.replace(/\s+/g, '')
                        );
                        Return foundKey ? DetailsObj[foundKey] : null;
                      };

                      Const detailsVal = getVal('DETAILS');

                      Return (
                        <>
                          {specKeys.map((key) => {
                            Const val = getVal(key);
                            If (!val) return null;
                            Return (
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
                  OnClick={() => setIsDescExpanded(false)}
                  ClassName="smooth-transition"
                  Style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', marginTop: '12px', display: 'inline-block', letterSpacing: '0.5px' }}
                >
                  See less
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

Const AdminProducts: React.FC<AdminProductsProps> = ({
  ShowAddModal: externalShowAddModal,
  SetShowAddModal: externalSetShowAddModal,
  SearchQuery = '',
  OnSearchChange,
  IsFilterOpen = false,
  IsSearchOpen = false,
  DateFormat,
  IsAddOpen,
  OnToggleAdd,
  OnCloseAdd
}) => {
  Const [products, setProducts] = useState<Product[]>([]);
  Const [categories, setCategories] = useState<string[]>([]);
  Const [loading, setLoading] = useState<boolean>(true);
  Const [showAddModal, setShowAddModal] = useState<boolean>(false);
  Const [submitting, setSubmitting] = useState<boolean>(false);
  Const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  Const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  Const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  Const [editName, setEditName] = useState<string>('');
  Const [editPrice, setEditPrice] = useState<string>('');
  Const [editStock, setEditStock] = useState<string>('');
  Const [editCategory, setEditCategory] = useState<string>('');
  Const [editDescription, setEditDescription] = useState<string>('');
  Const [editFit, setEditFit] = useState<string>('');
  Const [editGsm, setEditGsm] = useState<string>('');
  Const [editMadeIn, setEditMadeIn] = useState<string>('');
  Const [editMaterial, setEditMaterial] = useState<string>('');
  Const [editCare, setEditCare] = useState<string>('');
  Const [editSleeve, setEditSleeve] = useState<string>('');
  Const [editPattern, setEditPattern] = useState<string>('');
  Const [editOccasion, setEditOccasion] = useState<string>('');
  Const [editSizes, setEditSizes] = useState<string>('');
  Const [editColors, setEditColors] = useState<string>('');
  Const [editDetails, setEditDetails] = useState<string>('');
  Const [editExistingMedia, setEditExistingMedia] = useState<{ id?: string | number; media_url: string; media_type: string }[]>([]);
  Const [editMediaFiles, setEditMediaFiles] = useState<File[]>([]);
  Const [editMediaPreviews, setEditMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);

  Const [searchTerm, setSearchTerm] = useState<string>('');
  Const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sold_out'>('all');
  Const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  Const [priceSort, setPriceSort] = useState<'none' | 'price_low' | 'price_high'>('none');
  Const [startDate, setStartDate] = useState<string>('');
  Const [endDate, setEndDate] = useState<string>('');
  Const [minPrice, setMinPrice] = useState<string>('');
  Const [maxPrice, setMaxPrice] = useState<string>('');

  Const [newName, setNewName] = useState<string>('');
  Const [newPrice, setNewPrice] = useState<string>('');
  Const [newStock, setNewStock] = useState<string>('');
  Const [newCategory, setNewCategory] = useState<string>('');
  Const [newDescription, setNewDescription] = useState<string>('');

  Const [newFit, setNewFit] = useState<string>('');
  Const [newGsm, setNewGsm] = useState<string>('');
  Const [newMadeIn, setNewMadeIn] = useState<string>('');
  Const [newMaterial, setNewMaterial] = useState<string>('');
  Const [newCare, setNewCare] = useState<string>('');
  Const [newSleeve, setNewSleeve] = useState<string>('');
  Const [newPattern, setNewPattern] = useState<string>('');
  Const [newOccasion, setNewOccasion] = useState<string>('');
  Const [newSizes, setNewSizes] = useState<string>('');
  Const [newColors, setNewColors] = useState<string>('');
  Const [newDetails, setNewDetails] = useState<string>('');

  Const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  Const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  Const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  Const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  UseEffect(() => {
    If (isAddOpen !== undefined) {
      SetShowAddModal(isAddOpen);
    } else if (externalShowAddModal !== undefined) {
      SetShowAddModal(externalShowAddModal);
    }
  }, [isAddOpen, externalShowAddModal]);

  Const handleSetShowAddModal = (value: boolean) => {
    SetShowAddModal(value);
    If (externalSetShowAddModal) {
      ExternalSetShowAddModal(value);
    }
    If (!value && onCloseAdd) {
      OnCloseAdd();
    }
  };

  Const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    SetNotification({ message, type });
    SetTimeout(() => {
      SetNotification(null);
    }, 6000); // এরর ভালো করে পড়ার সুবিধার্থে সময় একটু বাড়িয়ে ৬ সেকেন্ড করা হয়েছে
  };

  Const fetchProducts = async () => {
    Try {
      SetLoading(true);
      Const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          Product_media (
            Media_url,
            Media_type,
            Sort_order
          )
        `)
        .order('created_at', { ascending: false });

      If (error) throw error;

      If (data) {
        Const formatted = data.map((p: any) => {
          Const sortedMedia = p.product_media?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          Return {
            Id: p.id,
            Name: p.name,
            Description: p.description || '',
            Details: p.details || {},
            Sizes: p.sizes || [],
            Colors: p.colors || [],
            Price: p.price,
            Stock_quantity: p.stock_quantity ?? 0,
            Status: p.status || 'active',
            Category: p.category || 'GENERAL',
            Created_at: p.created_at,
            Product_media: sortedMedia || [],
            Image_url: p.image_url
          };
        });

        SetProducts(formatted);
        Const uniqueCategories = Array.from(new Set(formatted.map((p: Product) => p.category)));
        SetCategories(uniqueCategories);
      }
    } catch (err: any) {
      Console.error('Error fetching admin products:', err);
      ShowNotification(`FETCH ERROR: ${getErrorMessage(err)}`, 'error');
    } finally {
      SetLoading(false);
    }
  };

  UseEffect(() => {
    FetchProducts();
  }, []);

  Const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Const files = Array.from(e.target.files || []);
    If (files.length > 0) {
      SetMediaFiles(prev => [...prev, ...files]);
      Const newPreviews = files.map(file => ({
        Url: URL.createObjectURL(file),
        Type: file.type.startsWith('video') ? ('video' as const) : ('image' as const)
      }));
      SetMediaPreviews(prev => [...prev, ...newPreviews]);
    }
    E.target.value = '';
  };

  Const removeSelectedMedia = (index: number) => {
    SetMediaPreviews(prev => {
      If (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      Return prev.filter((_, i) => i !== index);
    });
    SetMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  Const resetForm = () => {
    MediaPreviews.forEach(m => {
      If (m.url) URL.revokeObjectURL(m.url);
    });
    SetNewName('');
    SetNewPrice('');
    SetNewStock('');
    SetNewDescription('');
    SetNewCategory('');
    SetNewFit('');
    SetNewGsm('');
    SetNewMadeIn('');
    SetNewMaterial('');
    SetNewCare('');
    SetNewSleeve('');
    SetNewPattern('');
    SetNewOccasion('');
    SetNewSizes('');
    SetNewColors('');
    SetNewDetails('');
    SetMediaFiles([]);
    SetMediaPreviews([]);
  };

  Const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    Const val = e.target.value;
    Const words = val.trim().split(/\s+/).filter(Boolean);
    If (words.length <= 200 || val.length < newDescription.length) {
      SetNewDescription(val);
    }
  };

  Const handleAddProduct = async (e: React.FormEvent) => {
    E.preventDefault();
    If (!newName || !newPrice) {
      ShowNotification('PRODUCT NAME AND PRICE ARE REQUIRED.', 'error');
      Return;
    }

    Try {
      SetSubmitting(true);

      Const detailsJson: Record<string, string> = {};
      If (newFit) detailsJson['FIT'] = newFit;
      If (newGsm) detailsJson['GSM'] = newGsm;
      If (newMaterial) detailsJson['MATERIAL'] = newMaterial;
      If (newCare) detailsJson['CARE'] = newCare;
      If (newSleeve) detailsJson['SLEEVE'] = newSleeve;
      If (newPattern) detailsJson['PATTERN'] = newPattern;
      If (newOccasion) detailsJson['OCCASION'] = newOccasion;
      If (newMadeIn) detailsJson['MADE IN'] = newMadeIn;
      If (newDetails) detailsJson['DETAILS'] = newDetails;

      Const sizesArray = newSizes.split(',').map(s => s.trim()).filter(Boolean);
      Const colorsArray = newColors.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

      Const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert([{
          Name: newName,
          Price: parseFloat(newPrice),
          Stock_quantity: parseInt(newStock || '0', 10),
          Category: newCategory || 'GENERAL',
          Description: newDescription,
          Details: detailsJson,
          Sizes: sizesArray,
          Colors: colorsArray
        }])
        .select()
        .single();

      If (prodError) throw prodError;

      If (mediaFiles.length > 0 && newProd) {
        SetUploadingMedia(true);
        For (let i = 0; i < mediaFiles.length; i++) {
          Const file = mediaFiles[i];
          Const mediaUrl = await uploadToCloudinary(file);
          Const mediaType = file.type.startsWith('video') ? 'video' : 'image';

          Const { error: mediaErr } = await supabase.from('product_media').insert([{
            Product_id: newProd.id,
            Media_url: mediaUrl,
            Media_type: mediaType,
            Sort_order: i
          }]);

          If (mediaErr) throw mediaErr;
        }
        SetUploadingMedia(false);
      }

      HandleSetShowAddModal(false);
      ResetForm();
      FetchProducts();
      ShowNotification('PRODUCT & MULTIPLE MEDIA FILES UPLOADED SUCCESSFULLY.');
    } catch (err: any) {
      Console.error('Error creating product:', err);
      ShowNotification(`CREATE FAILED: ${getErrorMessage(err)}`, 'error');
    } finally {
      SetSubmitting(false);
      SetUploadingMedia(false);
    }
  };

  Const handleOpenEdit = (product: Product) => {
    SetEditingProduct(product);
    SetEditName(product.name || '');
    SetEditPrice(product.price ? String(product.price) : '');
    SetEditStock(product.stock_quantity !== undefined ? String(product.stock_quantity) : '0');
    SetEditCategory(product.category || '');
    SetEditDescription(product.description || '');

    Const details = product.details || {};
    Const getDetail = (key: string) => {
      Const foundKey = Object.keys(details).find(
        K => k.trim().toUpperCase() === key || k.trim().toUpperCase().replace(/\s+/g, '') === key.replace(/\s+/g, '')
      );
      Return foundKey ? Details[foundKey] : '';
    };

    SetEditFit(getDetail('FIT'));
    SetEditGsm(getDetail('GSM'));
    SetEditMadeIn(getDetail('MADE IN'));
    SetEditMaterial(getDetail('MATERIAL'));
    SetEditCare(getDetail('CARE'));
    SetEditSleeve(getDetail('SLEEVE'));
    SetEditPattern(getDetail('PATTERN'));
    SetEditOccasion(getDetail('OCCASION'));
    SetEditDetails(getDetail('DETAILS'));

    SetEditSizes(product.sizes ? Product.sizes.join(', ') : '');
    SetEditColors(product.colors ? Product.colors.join(', ') : '');
    SetEditExistingMedia(product.product_media || []);
    SetEditMediaFiles([]);
    SetEditMediaPreviews([]);
  };

  Const handleEditMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Const files = Array.from(e.target.files || []);
    If (files.length > 0) {
      SetEditMediaFiles(prev => [...prev, ...files]);
      Const newPreviews = files.map(file => ({
        Url: URL.createObjectURL(file),
        Type: file.type.startsWith('video') ? ('video' as const) : ('image' as const)
      }));
      SetEditMediaPreviews(prev => [...prev, ...newPreviews]);
    }
    E.target.value = '';
  };

  Const removeSelectedEditMedia = (index: number) => {
    SetEditMediaPreviews(prev => {
      If (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      Return prev.filter((_, i) => i !== index);
    });
    SetEditMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  Const removeExistingMedia = (index: number) => {
    SetEditExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  Const handleEditDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    Const val = e.target.value;
    Const words = val.trim().split(/\s+/).filter(Boolean);
    If (words.length <= 200 || val.length < editDescription.length) {
      SetEditDescription(val);
    }
  };

  Const handleUpdateProduct = async (e: React.FormEvent) => {
    E.preventDefault();
    If (!editingProduct || !editName || !editPrice) {
      ShowNotification('PRODUCT NAME AND PRICE ARE REQUIRED.', 'error');
      Return;
    }

    Try {
      SetSubmitting(true);

      Const detailsJson: Record<string, string> = {};
      If (editFit) detailsJson['FIT'] = editFit;
      If (editGsm) detailsJson['GSM'] = editGsm;
      If (editMaterial) detailsJson['MATERIAL'] = editMaterial;
      If (editCare) detailsJson['CARE'] = editCare;
      If (editSleeve) detailsJson['SLEEVE'] = editSleeve;
      If (editPattern) detailsJson['PATTERN'] = editPattern;
      If (editOccasion) detailsJson['OCCASION'] = editOccasion;
      If (editMadeIn) detailsJson['MADE IN'] = editMadeIn;
      If (editDetails) detailsJson['DETAILS'] = editDetails;

      Const sizesArray = editSizes.split(',').map(s => s.trim()).filter(Boolean);
      Const colorsArray = editColors.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

      Const { error: updateError } = await supabase
        .from('products')
        .update({
          Name: editName,
          Price: parseFloat(editPrice),
          Stock_quantity: parseInt(editStock || '0', 10),
          Category: editCategory || 'GENERAL',
          Description: editDescription,
          Details: detailsJson,
          Sizes: sizesArray,
          Colors: colorsArray
        })
        .eq('id', editingProduct.id);

      If (updateError) throw updateError;

      Const { error: delMediaErr } = await supabase.from('product_media').delete().eq('product_id', editingProduct.id);
      If (delMediaErr) throw delMediaErr;

      For (let i = 0; i < editExistingMedia.length; i++) {
        Const { error: insExistingErr } = await supabase.from('product_media').insert([{
          Product_id: editingProduct.id,
          Media_url: editExistingMedia[i].media_url,
          Media_type: editExistingMedia[i].media_type,
          Sort_order: i
        }]);
        If (insExistingErr) throw insExistingErr;
      }

      If (editMediaFiles.length > 0) {
        SetUploadingMedia(true);
        Const startOrder = editExistingMedia.length;
        For (let i = 0; i < editMediaFiles.length; i++) {
          Const file = editMediaFiles[i];
          Const mediaUrl = await uploadToCloudinary(file);
          Const mediaType = file.type.startsWith('video') ? 'video' : 'image';

          Const { error: insNewErr } = await supabase.from('product_media').insert([{
            Product_id: editingProduct.id,
            Media_url: mediaUrl,
            Media_type: mediaType,
            Sort_order: startOrder + i
          }]);
          If (insNewErr) throw insNewErr;
        }
        SetUploadingMedia(false);
      }

      SetEditingProduct(null);
      FetchProducts();
      ShowNotification('PRODUCT UPDATED SUCCESSFULLY.');
    } catch (err: any) {
      Console.error('Error updating product:', err);
      ShowNotification(`UPDATE FAILED: ${getErrorMessage(err)}`, 'error');
    } finally {
      SetSubmitting(false);
      SetUploadingMedia(false);
    }
  };

  Const handleStockUpdate = async (productId: string | number, currentStock: number, change: number) => {
    Const updated = Math.max(0, currentStock + change);
    Try {
      SetProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: updated } : p));
      Const { error } = await supabase.from('products').update({ stock_quantity: updated }).eq('id', productId);
      If (error) throw error;
    } catch (err: any) {
      Console.error('Failed to update stock:', err);
      ShowNotification(`STOCK UPDATE FAILED: ${getErrorMessage(err)}`, 'error');
      FetchProducts();
    }
  };

  Const handleDeleteProduct = (productId: string | number) => {
    Const targetProduct = products.find(p => p.id === productId) || null;
    SetDeletingProduct(targetProduct);
  };

  Const handleSoftDeleteProduct = async () => {
    If (!deletingProduct) return;
    Const productId = deletingProduct.id;
    SetDeletingProduct(null);
    Try {
      SetProducts(prev => prev.filter(p => p.id !== productId));
      Const { error } = await supabase.from('products').update({ status: 'archived' }).eq('id', productId);
      If (error) throw error;
      ShowNotification('PRODUCT HIDDEN FROM CATALOG.');
    } catch (err: any) {
      Console.error('Failed to hide product:', err);
      ShowNotification(`HIDE FAILED: ${getErrorMessage(err)}`, 'error');
      FetchProducts();
    }
  };

  Const handleHardDeleteProduct = async () => {
    If (!deletingProduct) return;
    Const productId = deletingProduct.id;
    Const mediaList = deletingProduct.product_media || [];
    SetDeletingProduct(null);
    Try {
      SetProducts(prev => prev.filter(p => p.id !== productId));

      If (mediaList.length > 0 && typeof deleteFromCloudinary === 'function') {
        For (const media of mediaList) {
          If (media.media_url) {
            Try {
              Await deleteFromCloudinary(media.media_url);
            } catch (e: any) {
              Console.error('Failed to delete media from Cloudinary:', e);
              // Cloudinary delete fail হলেও DB delete সামনে এগোবে, তবে নোটিফিকেশনে সতর্ক রাখা হলো
            }
          }
        }
      }

      Const { error: mediaDelError } = await supabase.from('product_media').delete().eq('product_id', productId);
      If (mediaDelError) throw mediaDelError;

      Const { error } = await supabase.from('products').delete().eq('id', productId);
      If (error) throw error;

      ShowNotification('PRODUCT PERMANENTLY DELETED FROM DATABASE & CLOUDINARY.');
    } catch (err: any) {
      Console.error('Failed to delete product:', err);
      ShowNotification(`DELETE FAILED: ${getErrorMessage(err)}`, 'error');
      FetchProducts();
    }
  };

  Const activeSearch = searchQuery || searchTerm;

  Let filteredProducts = products.filter(p => {
    If (p.status === 'archived' || p.status === 'hidden') return false;

    Const matchesSearch = p.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
                          P.category?.toLowerCase().includes(activeSearch.toLowerCase());
    If (!matchesSearch) return false;

    If (stockFilter === 'in_stock' && p.stock_quantity <= 0) return false;
    If (stockFilter === 'sold_out' && p.stock_quantity > 0) return false;

    Const hasMin = minPrice !== '' && !isNaN(parseFloat(minPrice));
    Const hasMax = maxPrice !== '' && !isNaN(parseFloat(maxPrice));

    If (hasMin && hasMax) {
      If (p.price < parseFloat(minPrice) || p.price > parseFloat(maxPrice)) return false;
    } else if (hasMin) {
      If (p.price !== parseFloat(minPrice)) return false;
    } else if (hasMax) {
      If (p.price !== parseFloat(maxPrice)) return false;
    }

    Const hasStart = startDate !== '';
    Const hasEnd = endDate !== '';
    Const pTime = new Date(p.created_at).getTime();

    If (hasStart && hasEnd) {
      Const sTime = new Date(`${startDate}T00:00:00`).getTime();
      Const eTime = new Date(`${endDate}T23:59:59.999`).getTime();
      If (pTime < sTime || pTime > eTime) return false;
    } else if (hasStart) {
      Const sTime = new Date(`${startDate}T00:00:00`).getTime();
      Const eTime = new Date(`${startDate}T23:59:59.999`).getTime();
      If (pTime < sTime || pTime > eTime) return false;
    } else if (hasEnd) {
      Const sTime = new Date(`${endDate}T00:00:00`).getTime();
      Const eTime = new Date(`${endDate}T23:59:59.999`).getTime();
      If (pTime < sTime || pTime > eTime) return false;
    }

    Return true;
  });

  FilteredProducts.sort((a, b) => {
    If (a.stock_quantity !== b.stock_quantity) {
      Return a.stock_quantity - b.stock_quantity;
    }

    If (priceSort === 'price_low') {
      If (a.price !== b.price) return a.price - b.price;
    } else if (priceSort === 'price_high') {
      If (a.price !== b.price) return b.price - a.price;
    }

    Const timeA = new Date(a.created_at).getTime();
    Const timeB = new Date(b.created_at).getTime();
    If (dateSort === 'oldest') {
      Return timeA - timeB;
    } else {
      Return timeB - timeA;
    }
  });

  Const filteredCategories = Array.from(new Set(filteredProducts.map(p => p.category)));

  Return (
    <div className="admin-products-container animate-fade-in" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#000', minHeight: '100vh', padding: '0 20px 20px 20px', boxSizing: 'border-box' }}>
      {notification && createPortal(
        <div
          ClassName="animate-pop"
          Style={{
            Position: 'fixed',
            Top: '20px',
            Right: '20px',
            ZIndex: 10001,
            BackgroundColor: '#0d0d0d',
            Border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
            BoxShadow: notification.type === 'error'
              ? '0 10px 30px rgba(239, 68, 68, 0.15)'
              : '0 10px 30px rgba(34, 197, 94, 0.15)',
            Color: '#ffffff',
            Padding: '12px 18px',
            BorderRadius: '8px',
            FontFamily: 'monospace',
            FontSize: '11px',
            LetterSpacing: '0.5px',
            Display: 'flex',
            AlignItems: 'center',
            Gap: '10px',
            MaxWidth: '90vw',
            WordBreak: 'break-word'
          }}
        >
          <span style={{
            Display: 'flex',
            AlignItems: 'center',
            JustifyContent: 'center',
            Width: '20px',
            Height: '20px',
            BorderRadius: '50%',
            BackgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            Color: notification.type === 'error' ? '#ef4444' : '#22c55e',
            FontSize: '11px',
            FontWeight: 'bold',
            Padding: 0,
            LineHeight: 1,
            FlexShrink: 0
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{notification.type === 'error' ? '✕' : '✓'}</span>
          </span>
          <span>{notification.message}</span>
        </div>,
        Document.body
      )}

      <div className={`filter-expand-wrapper ${isFilterOpen || isSearchOpen ? 'open' : ''}`}>
        <div className="filter-expand-content">
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px', marginTop: '10px', backgroundColor: '#080808', padding: '16px', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
            <div className={`search-filter-sub-wrapper ${isSearchOpen ? 'open' : ''}`}>
              <div className="search-filter-sub-inner">
                <div style={{ paddingBottom: isFilterOpen ? '16px' : '0px', transition: 'padding 0.35s ease' }}>
                  <input
                    Type="text"
                    Value={searchQuery || searchTerm}
                    OnChange={(e) => {
                      If (onSearchChange) {
                        OnSearchChange(e.target.value);
                      }
                      SetSearchTerm(e.target.value);
                    }}
                    Placeholder="SEARCH PRODUCTS..."
                    ClassName="smooth-transition animate-fade-in"
                    Style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', borderRadius: '25px', padding: '8px 16px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
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
                          Key={item.value}
                          Type="button"
                          OnClick={() => setStockFilter(item.value as any)}
                          ClassName="smooth-transition"
                          Style={{
                            Background: 'none',
                            Border: 'none',
                            Padding: '0',
                            Color: stockFilter === item.value ? '#fff' : '#666',
                            FontSize: '11px',
                            FontFamily: 'monospace',
                            Cursor: 'pointer',
                            FontWeight: stockFilter === item.value ? '700' : 'normal',
                            TextDecoration: 'none',
                            FlexShrink: 0
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
                            Key={item.value}
                            Type="button"
                            OnClick={() => setDateSort(item.value as any)}
                            ClassName="smooth-transition"
                            Style={{
                              Background: 'none',
                              Border: 'none',
                              Padding: '0',
                              Color: dateSort === item.value ? '#fff' : '#666',
                              FontSize: '11px',
                              FontFamily: 'monospace',
                              Cursor: 'pointer',
                              FontWeight: dateSort === item.value ? '700' : 'normal',
                              TextDecoration: 'none',
                              FlexShrink: 0
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <input
                          Type="date"
                          Value={startDate}
                          OnChange={(e) => setStartDate(e.target.value)}
                          ClassName="smooth-transition"
                          Style={{ backgroundColor: '#000', border: '1px solid #333', color: '#aaa', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
                        />
                        <span style={{ color: '#555', fontSize: '10px' }}>-</span>
                        <input
                          Type="date"
                          Value={endDate}
                          OnChange={(e) => setEndDate(e.target.value)}
                          ClassName="smooth-transition"
                          Style={{ backgroundColor: '#000', border: '1px solid #333', color: '#aaa', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
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
                            Key={item.value}
                            Type="button"
                            OnClick={() => setPriceSort(priceSort === item.value ? 'none' : item.value as any)}
                            ClassName="smooth-transition"
                            Style={{
                              Background: 'none',
                              Border: 'none',
                              Padding: '0',
                              Color: priceSort === item.value ? '#fff' : '#666',
                              FontSize: '11px',
                              FontFamily: 'monospace',
                              Cursor: 'pointer',
                              FontWeight: priceSort === item.value ? '700' : 'normal',
                              TextDecoration: 'none',
                              FlexShrink: 0
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <input
                          Type="number"
                          Placeholder="MIN"
                          Value={minPrice}
                          OnChange={(e) => setMinPrice(e.target.value)}
                          ClassName="smooth-transition"
                          Style={{ width: '60px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
                        />
                        <span style={{ color: '#555', fontSize: '10px' }}>-</span>
                        <input
                          Type="number"
                          Placeholder="MAX"
                          Value={maxPrice}
                          OnChange={(e) => setMaxPrice(e.target.value)}
                          ClassName="smooth-transition"
                          Style={{ width: '60px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
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
              Const categoryProducts = filteredProducts.filter(p => p.category === category);
              Const isExpanded = !!expandedCategories[category];

              Return (
                <div key={category} className="showroom-section animate-fade-in" style={{ marginBottom: '50px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px 12px 15px', borderBottom: '1px solid #141414' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase' }}>{category}</h3>
                    <button
                      OnClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                      ClassName="smooth-transition"
                      Style={{
                        Background: 'none',
                        Border: 'none',
                        Color: '#fff',
                        FontSize: '11px',
                        LetterSpacing: '2px',
                        Cursor: 'pointer',
                        Opacity: 0.7,
                        Display: 'flex',
                        Padding: 0,
                        AlignItems: 'center',
                        MinWidth: '85px',
                        JustifyContent: 'flex-end',
                        WhiteSpace: 'nowrap'
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
                        Key={product.id}
                        Product={product}
                        OnUpdateStock={handleStockUpdate}
                        OnDelete={handleDeleteProduct}
                        OnEdit={handleOpenEdit}
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
        Document.body
      )}

      {editingProduct && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="animate-pop" style={{ backgroundColor: '#050505', border: '1px solid #262626', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ color: '#fff', fontSize: '13px', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>EDIT PRODUCT</h3>
              <button
                Type="button"
                OnClick={() => setEditingProduct(null)}
                ClassName="smooth-transition"
                Style={{
                  Background: 'rgba(255, 255, 255, 0.05)',
                  Border: '1px solid rgba(255, 255, 255, 0.1)',
                  BorderRadius: '50%',
                  Width: '30px',
                  Height: '30px',
                  Color: '#aaa',
                  Cursor: 'pointer',
                  Display: 'flex',
                  AlignItems: 'center',
                  JustifyContent: 'center',
                  Padding: 0,
                  LineHeight: 1,
                  FontSize: '12px'
                }}
                OnMouseEnter={(e) => {
                  E.currentTarget.style.background = '#ef4444';
                  E.currentTarget.style.color = '#fff';
                  E.currentTarget.style.borderColor = '#ef4444';
                }}
                OnMouseLeave={(e) => {
                  E.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  E.currentTarget.style.color = '#aaa';
                  E.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
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
                    Type="text"
                    Value={editCategory}
                    OnChange={(e) => setEditCategory(e.target.value)}
                    Placeholder="Category (e.g. APPAREL)"
                    ClassName="minimal-input"
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
                        Type="button"
                        OnClick={() => removeExistingMedia(idx)}
                        ClassName="smooth-transition"
                        Style={{
                          Position: 'absolute',
                          Top: '-5px',
                          Right: '-5px',
                          Background: '#ef4444',
                          Color: '#fff',
                          Border: 'none',
                          BorderRadius: '50%',
                          Width: '16px',
                          Height: '16px',
                          FontSize: '9px',
                          Cursor: 'pointer',
                          Display: 'flex',
                          AlignItems: 'center',
                          JustifyContent: 'center',
                          Padding: 0,
                          LineHeight: 1,
                          FontWeight: 'bold'
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
                        Type="button"
                        OnClick={() => removeSelectedEditMedia(idx)}
                        ClassName="smooth-transition"
                        Style={{
                          Position: 'absolute',
                          Top: '-5px',
                          Right: '-5px',
                          Background: '#ef4444',
                          Color: '#fff',
                          Border: 'none',
                          BorderRadius: '50%',
                          Width: '16px',
                          Height: '16px',
                          FontSize: '9px',
                          Cursor: 'pointer',
                          Display: 'flex',
                          AlignItems: 'center',
                          JustifyContent: 'center',
                          Padding: 0,
                          LineHeight: 1,
                          FontWeight: 'bold'
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
                  Type="text"
                  Value={editName}
                  OnChange={(e) => setEditName(e.target.value)}
                  Placeholder="Product Name *"
                  ClassName="minimal-input"
                />
              </div>

              <div>
                <textarea
                  Value={editDescription}
                  OnChange={handleEditDescriptionChange}
                  Placeholder="Description (Bio)"
                  Rows={2}
                  ClassName="minimal-input"
                  Style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input
                  Type="number"
                  Value={editPrice}
                  OnChange={(e) => setEditPrice(e.target.value)}
                  Placeholder="Price (৳) *"
                  ClassName="minimal-input"
                  Style={{ flex: '1 1 130px' }}
                />
                <input
                  Type="number"
                  Value={editStock}
                  OnChange={(e) => setEditStock(e.target.value)}
                  Placeholder="Stock Quantity"
                  ClassName="minimal-input"
                  Style={{ flex: '1 1 130px' }}
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
                  Value={editDetails}
                  OnChange={(e) => setEditDetails(e.target.value)}
                  Placeholder="Details (Product Details)"
                  Rows={3}
                  ClassName="minimal-input"
                  Style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  Type="button"
                  OnClick={() => setEditingProduct(null)}
                  ClassName="smooth-transition"
                  Style={{
                    Flex: 1,
                    Background: 'transparent',
                    Border: '1px solid #333',
                    BorderRadius: '6px',
                    Color: '#aaa',
                    Padding: '10px',
                    FontSize: '11px',
                    LetterSpacing: '1px',
                    Cursor: 'pointer',
                    FontWeight: '600'
                  }}
                >
                  CANCEL
                </button>
                <button
                  Type="submit"
                  Disabled={submitting || uploadingMedia}
                  ClassName="smooth-transition"
                  Style={{
                    Flex: 1,
                    Background: 'rgba(255, 255, 255, 0.08)',
                    Border: '1px solid rgba(255, 255, 255, 0.2)',
                    BorderRadius: '6px',
                    Color: '#fff',
                    Padding: '10px',
                    FontSize: '11px',
                    LetterSpacing: '1px',
                    FontWeight: '600',
                    Cursor: 'pointer'
                  }}
                >
                  {uploadingMedia ? 'UPLOADING MEDIA...' : submitting ? 'SAVING...' : 'UPDATE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        Document.body
      )}

      {showAddModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="animate-pop" style={{ backgroundColor: '#050505', border: '1px solid #262626', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ color: '#fff', fontSize: '13px', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>ADD NEW PRODUCT</h3>
              <button
                Type="button"
                OnClick={() => handleSetShowAddModal(false)}
                ClassName="smooth-transition"
                Style={{
                  Background: 'rgba(255, 255, 255, 0.05)',
                  Border: '1px solid rgba(255, 255, 255, 0.1)',
                  BorderRadius: '50%',
                  Width: '30px',
                  Height: '30px',
                  Color: '#aaa',
                  Cursor: 'pointer',
                  Display: 'flex',
                  AlignItems: 'center',
                  JustifyContent: 'center',
                  Padding: 0,
                  LineHeight: 1,
                  FontSize: '12px'
                }}
                OnMouseEnter={(e) => {
                  E.currentTarget.style.background = '#ef4444';
                  E.currentTarget.style.color = '#fff';
                  E.currentTarget.style.borderColor = '#ef4444';
                }}
                OnMouseLeave={(e) => {
                  E.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  E.currentTarget.style.color = '#aaa';
                  E.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
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
                    Type="text"
                    Value={newCategory}
                    OnChange={(e) => setNewCategory(e.target.value)}
                    Placeholder="Category (e.g. APPAREL)"
                    ClassName="minimal-input"
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
                        Type="button"
                        OnClick={() => removeSelectedMedia(idx)}
                        ClassName="smooth-transition"
                        Style={{
                          Position: 'absolute',
                          Top: '-5px',
                          Right: '-5px',
                          Background: '#ef4444',
                          Color: '#fff',
                          Border: 'none',
                          BorderRadius: '50%',
                          Width: '16px',
                          Height: '16px',
                          FontSize: '9px',
                          Cursor: 'pointer',
                          Display: 'flex',
                          AlignItems: 'center',
                          JustifyContent: 'center',
                          Padding: 0,
                          LineHeight: 1,
                          FontWeight: 'bold'
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
                  Type="text"
                  Value={newName}
                  OnChange={(e) => setNewName(e.target.value)}
                  Placeholder="Product Name *"
                  ClassName="minimal-input"
                />
              </div>

              <div>
                <textarea
                  Value={newDescription}
                  OnChange={handleDescriptionChange}
                  Placeholder="Description (Bio)"
                  Rows={2}
                  ClassName="minimal-input"
                  Style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input
                  Type="number"
                  Value={newPrice}
                  OnChange={(e) => setNewPrice(e.target.value)}
                  Placeholder="Price (৳) *"
                  ClassName="minimal-input"
                  Style={{ flex: '1 1 130px' }}
                />
                <input
                  Type="number"
                  Value={newStock}
                  OnChange={(e) => setNewStock(e.target.value)}
                  Placeholder="Stock Quantity"
                  ClassName="minimal-input"
                  Style={{ flex: '1 1 130px' }}
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
                  Value={newDetails}
                  OnChange={(e) => setNewDetails(e.target.value)}
                  Placeholder="Details (Product Details)"
                  Rows={3}
                  ClassName="minimal-input"
                  Style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  Type="button"
                  OnClick={() => handleSetShowAddModal(false)}
                  ClassName="smooth-transition"
                  Style={{
                    Flex: 1,
                    Background: 'transparent',
                    Border: '1px solid #333',
                    BorderRadius: '6px',
                    Color: '#aaa',
                    Padding: '10px',
                    FontSize: '11px',
                    LetterSpacing: '1px',
                    Cursor: 'pointer',
                    FontWeight: '600'
                  }}
                >
                  CANCEL
                </button>
                <button
                  Type="submit"
                  Disabled={submitting || uploadingMedia}
                  ClassName="smooth-transition"
                  Style={{
                    Flex: 1,
                    Background: 'rgba(255, 255, 255, 0.08)',
                    Border: '1px solid rgba(255, 255, 255, 0.2)',
                    BorderRadius: '6px',
                    Color: '#fff',
                    Padding: '10px',
                    FontSize: '11px',
                    LetterSpacing: '1px',
                    FontWeight: '600',
                    Cursor: 'pointer'
                  }}
                >
                  {uploadingMedia ? 'UPLOADING MEDIA...' : submitting ? 'SAVING...' : 'CREATE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        Document.body
      )}

      <style>{`
        @keyframes swapFadeIn {
          From { opacity: 0; transform: translateY(1px); }
          To { opacity: 1; transform: translateY(0); }
        }
        .minimal-input {
          Background: transparent !important;
          Border: none !important;
          Border-bottom: 1px solid #262626 !important;
          Color: #fff !important;
          Font-size: 11px !important;
          Outline: none !important;
          Padding: 8px 0 !important;
          Width: 100%;
          Box-sizing: border-box;
          Transition: border-color 0.2s ease;
          Font-family: inherit;
        }
        .minimal-input:focus {
          Border-bottom-color: #555 !important;
        }
        .minimal-input::placeholder {
          Color: #555;
        }
        .filter-expand-wrapper {
          Display: grid;
          Grid-template-rows: 0fr;
          Transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          Overflow: hidden;
        }
        .filter-expand-wrapper.open {
          Grid-template-rows: 1fr;
        }
        .filter-expand-content {
          Min-height: 0;
          Transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
          Opacity: 0;
          Transform: translateY(-8px);
          Overflow: hidden;
        }
        .filter-expand-wrapper.open .filter-expand-content {
          Opacity: 1;
          Transform: translateY(0);
        }
        .search-filter-sub-wrapper {
          Display: grid;
          Grid-template-rows: 0fr;
          Opacity: 0;
          Transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
          Overflow: hidden;
        }
        .search-filter-sub-wrapper.open {
          Grid-template-rows: 1fr;
          Opacity: 1;
        }
        .search-filter-sub-inner {
          Min-height: 0;
          Overflow: hidden;
        }
        .showroom-row-container::-webkit-scrollbar {
          Display: none;
        }
        .showroom-row-container {
          -ms-overflow-style: none;
          Scrollbar-width: none;
        }
        @media (max-width: 767px) {
          .admin-products-container {
            Padding-left: 0 !important;
            Padding-right: 0 !important;
          }
          .showroom-section {
            Width: 100%;
          }
          .showroom-card-item {
            Width: 100% !important;
            Min-width: 100% !important;
            Padding: 0 0 15px 0 !important;
            Border-left: none !important;
            Border-right: none !important;
            Border-radius: 0 !important;
          }
        }
        @media (min-width: 768px) {
          .showroom-section {
            Padding: 0;
          }
          .showroom-card-item {
            Width: 300px;
            Min-width: 300px;
            Padding: 12px;
            Margin-right: 15px;
            Margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

Export default AdminProducts;
