import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '@/cloudinary';
import './admin-animations.css';

import { Product, AdminProductsProps } from './products.types';
import { ProductShowroomCard } from './components/ProductShowroomCard';
import { ProductCreateView } from './components/ProductCreateView';
import { ProductEditView } from './components/ProductEditView';
import { ProductDeleteModal } from './components/ProductDeleteModal';

const AdminProductsManager: React.FC<AdminProductsProps> = ({
  showAddModal: externalShowAddModal,
  setShowAddModal: externalSetShowAddModal,
  searchQuery = '',
  onSearchChange,
  isFilterOpen = false,
  isSearchOpen = false,
  isAddOpen,
  onCloseAdd
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddPage, setShowAddPage] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [removedMediaUrls, setRemovedMediaUrls] = useState<string[]>([]);
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
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sold_out' | 'hidden'>('all');
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
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<{ type: 'soft' | 'hard'; productId: string | number } | null>(null);
  const [isConfirmedChecked, setIsConfirmedChecked] = useState<boolean>(false);

  useEffect(() => {
    if (isAddOpen !== undefined) {
      setShowAddPage(isAddOpen);
    } else if (externalShowAddModal !== undefined) {
      setShowAddPage(externalShowAddModal);
    }
  }, [isAddOpen, externalShowAddModal]);

  const handleSetShowAddModal = (value: boolean) => {
    setShowAddPage(value);
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
        const uniqueCategories = Array.from(new Set(formatted.map((p: Product) => p.category))) as string[];
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
      showNotification('Name and price are required.', 'error');
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
      showNotification('Product published successfully.');
    } catch (err: any) {
      console.error('Error creating product:', err);
      showNotification(err.message || 'Failed to create product.', 'error');
    } finally {
      setSubmitting(false);
      setUploadingMedia(false);
    }
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setRemovedMediaUrls([]);
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
    const mediaToRemove = editExistingMedia[index];
    if (mediaToRemove?.media_url) {
      setRemovedMediaUrls(prev => [...prev, mediaToRemove.media_url]);
    }
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
      showNotification('Name and price are required.', 'error');
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

      if (removedMediaUrls.length > 0 && typeof deleteFromCloudinary === 'function') {
        for (const url of removedMediaUrls) {
          try {
            await deleteFromCloudinary(url);
          } catch (e) {
            console.error('Failed to delete media from Cloudinary during edit:', e);
          }
        }
      }

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
      setRemovedMediaUrls([]);
      fetchProducts();
      showNotification('Product details updated.');
    } catch (err: any) {
      console.error('Error updating product:', err);
      showNotification(err.message || 'Failed to update product.', 'error');
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

  const handleUnhideProduct = async (productId: string | number) => {
    try {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'active' } : p));
      const { error } = await supabase.from('products').update({ status: 'active' }).eq('id', productId);
      if (error) throw error;
      showNotification('Product restored to catalog.');
    } catch (err) {
      console.error('Failed to unhide product:', err);
      showNotification('Unable to restore product.', 'error');
      fetchProducts();
    }
  };

  const handleConfirmDeleteAction = async () => {
    if (!deleteConfirmConfig) return;
    const { type, productId } = deleteConfirmConfig;
    setDeleteConfirmConfig(null);
    setIsConfirmedChecked(false);
    if (type === 'soft') {
      setEditingProduct(null);
      try {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'archived' } : p));
        const { error } = await supabase.from('products').update({ status: 'archived' }).eq('id', productId);
        if (error) throw error;
        showNotification('Product hidden from catalog.');
      } catch (err) {
        console.error('Failed to hide product:', err);
        showNotification('Unable to hide product.', 'error');
        fetchProducts();
      }
    } else {
      const prodToDel = products.find(p => p.id === productId);
      const mediaList = prodToDel?.product_media || [];
      setEditingProduct(null);
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
        showNotification('Product removed permanently.');
      } catch (err) {
        console.error('Failed to delete product:', err);
        showNotification('Unable to delete product.', 'error');
        fetchProducts();
      }
    }
  };

  const activeSearch = searchQuery || searchTerm;

  let filteredProducts = products.filter(p => {
    const isHiddenProduct = p.status === 'archived' || p.status === 'hidden';

    if (stockFilter === 'hidden') {
      if (!isHiddenProduct) return false;
    } else {
      if (isHiddenProduct) return false;
      if (stockFilter === 'in_stock' && p.stock_quantity <= 0) return false;
      if (stockFilter === 'sold_out' && p.stock_quantity > 0) return false;
    }

    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();
      const idStr = String(p.id).toLowerCase();
      const nameStr = (p.name || '').toLowerCase();
      const descStr = (p.description || '').toLowerCase();
      const catStr = (p.category || '').toLowerCase();
      const priceStr = String(p.price);
      const colorsStr = (p.colors || []).join(' ').toLowerCase();
      const sizesStr = (p.sizes || []).join(' ').toLowerCase();
      const detailsStr = p.details
        ? Object.entries(p.details).map(([k, v]) => `${k} ${v}`).join(' ').toLowerCase()
        : '';
      let dateStr = '';
      if (p.created_at) {
        const d = new Date(p.created_at);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dateStr = `${y} ${m} ${day} ${y},${m},${day} ${y}-${m}-${day}`.toLowerCase();
        }
      }

      const matchesSearch =
        idStr.includes(q) ||
        nameStr.includes(q) ||
        descStr.includes(q) ||
        catStr.includes(q) ||
        priceStr.includes(q) ||
        colorsStr.includes(q) ||
        sizesStr.includes(q) ||
        detailsStr.includes(q) ||
        dateStr.includes(q);

      if (!matchesSearch) return false;
    }

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

  const filteredCategories = Array.from(new Set(filteredProducts.map(p => p.category))) as string[];

  if (showAddPage) {
    return (
      <>
        {notification && createPortal(
          <div className="animate-pop" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10001, backgroundColor: '#0d0d0d', border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`, boxShadow: notification.type === 'error' ? '0 10px 30px rgba(239, 68, 68, 0.15)' : '0 10px 30px rgba(34, 197, 94, 0.15)', color: '#ffffff', padding: '12px 18px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: notification.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '11px', fontWeight: 'bold', padding: 0, lineHeight: 1 }}>{notification.type === 'error' ? '✕' : '✓'}</span>
            <span>{notification.message}</span>
          </div>,
          document.body
        )}
        <ProductCreateView
          onClose={() => handleSetShowAddModal(false)}
          onSubmit={handleAddProduct}
          submitting={submitting}
          uploadingMedia={uploadingMedia}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          newName={newName}
          setNewName={setNewName}
          newDescription={newDescription}
          handleDescriptionChange={handleDescriptionChange}
          newPrice={newPrice}
          setNewPrice={setNewPrice}
          newStock={newStock}
          setNewStock={setNewStock}
          newFit={newFit}
          setNewFit={setNewFit}
          newGsm={newGsm}
          setNewGsm={setNewGsm}
          newSizes={newSizes}
          setNewSizes={setNewSizes}
          newColors={newColors}
          setNewColors={setNewColors}
          newMaterial={newMaterial}
          setNewMaterial={setNewMaterial}
          newCare={newCare}
          setNewCare={setNewCare}
          newSleeve={newSleeve}
          setNewSleeve={setNewSleeve}
          newPattern={newPattern}
          setNewPattern={setNewPattern}
          newOccasion={newOccasion}
          setNewOccasion={setNewOccasion}
          newMadeIn={newMadeIn}
          setNewMadeIn={setNewMadeIn}
          newDetails={newDetails}
          setNewDetails={setNewDetails}
          mediaPreviews={mediaPreviews}
          handleMediaChange={handleMediaChange}
          removeSelectedMedia={removeSelectedMedia}
        />
      </>
    );
  }

  if (editingProduct) {
    return (
      <>
        {notification && createPortal(
          <div className="animate-pop" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10001, backgroundColor: '#0d0d0d', border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`, boxShadow: notification.type === 'error' ? '0 10px 30px rgba(239, 68, 68, 0.15)' : '0 10px 30px rgba(34, 197, 94, 0.15)', color: '#ffffff', padding: '12px 18px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: notification.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '11px', fontWeight: 'bold', padding: 0, lineHeight: 1 }}>{notification.type === 'error' ? '✕' : '✓'}</span>
            <span>{notification.message}</span>
          </div>,
          document.body
        )}
        <ProductEditView
          editingProduct={editingProduct}
          onClose={() => {
            setEditingProduct(null);
            setRemovedMediaUrls([]);
          }}
          onSubmit={handleUpdateProduct}
          onOpenDeleteConfirm={(type, productId) => {
            setDeleteConfirmConfig({ type, productId });
            setIsConfirmedChecked(false);
          }}
          submitting={submitting}
          uploadingMedia={uploadingMedia}
          editCategory={editCategory}
          setEditCategory={setEditCategory}
          editName={editName}
          setEditName={setEditName}
          editDescription={editDescription}
          handleEditDescriptionChange={handleEditDescriptionChange}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          editStock={editStock}
          setEditStock={setEditStock}
          editFit={editFit}
          setEditFit={setEditFit}
          editGsm={editGsm}
          setEditGsm={setEditGsm}
          editSizes={editSizes}
          setEditSizes={setEditSizes}
          editColors={editColors}
          setEditColors={setEditColors}
          editMaterial={editMaterial}
          setEditMaterial={setEditMaterial}
          editCare={editCare}
          setEditCare={setEditCare}
          editSleeve={editSleeve}
          setEditSleeve={setEditSleeve}
          editPattern={editPattern}
          setEditPattern={setEditPattern}
          editOccasion={editOccasion}
          setEditOccasion={setEditOccasion}
          editMadeIn={editMadeIn}
          setEditMadeIn={setEditMadeIn}
          editDetails={editDetails}
          setEditDetails={setEditDetails}
          editExistingMedia={editExistingMedia}
          editMediaPreviews={editMediaPreviews}
          handleEditMediaChange={handleEditMediaChange}
          removeExistingMedia={removeExistingMedia}
          removeSelectedEditMedia={removeSelectedEditMedia}
        />
        <ProductDeleteModal
          config={deleteConfirmConfig}
          isChecked={isConfirmedChecked}
          onCheckChange={setIsConfirmedChecked}
          onCancel={() => {
            setDeleteConfirmConfig(null);
            setIsConfirmedChecked(false);
          }}
          onConfirm={handleConfirmDeleteAction}
        />
      </>
    );
  }

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
                        { label: 'SOLD OUT', value: 'sold_out' },
                        { label: 'HIDDEN', value: 'hidden' }
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
                      <ProductShowroomCard
                        key={product.id}
                        product={product}
                        onUpdateStock={handleStockUpdate}
                        onEdit={handleOpenEdit}
                        onUnhide={handleUnhideProduct}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
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
