import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '@/cloudinary';
import { Product } from '@/components/admin/products/products.types';

export function useAdminProducts(searchQuery: string = '', onCloseAdd?: () => void, externalShowAddModal?: boolean, setShowAddModalExternal?: (val: boolean) => void) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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

  const handleAddProduct = async (e: React.FormEvent, setShowAddPage: (val: boolean) => void) => {
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
          const mediaUrl = await uploadToCloudinary(file, 'products');
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

      setShowAddPage(false);
      if (setShowAddModalExternal) setShowAddModalExternal(false);
      if (onCloseAdd) onCloseAdd();
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
          const mediaUrl = await uploadToCloudinary(file, 'products');
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

  const activeSearch = searchQuery;

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

  return {
    products, filteredProducts, filteredCategories, loading, showAddPage, setShowAddPage,
    submitting, expandedCategories, setExpandedCategories, editingProduct, setEditingProduct,
    removedMediaUrls, setRemovedMediaUrls, editName, setEditName, editPrice, setEditPrice,
    editStock, setEditStock, editCategory, setEditCategory, editDescription, setEditDescription,
    editFit, setEditFit, editGsm, setEditGsm, editMadeIn, setEditMadeIn, editMaterial, setEditMaterial,
    editCare, setEditCare, editSleeve, setEditSleeve, editPattern, setEditPattern, editOccasion,
    setEditOccasion, editSizes, setEditSizes, editColors, setEditColors, editDetails, setEditDetails,
    editExistingMedia, editMediaFiles, editMediaPreviews, handleEditMediaChange, removeExistingMedia,
    removeSelectedEditMedia, handleEditDescriptionChange, handleUpdateProduct, handleStockUpdate,
    handleUnhideProduct, handleOpenEdit, handleAddProduct, handleMediaChange, removeSelectedMedia,
    handleDescriptionChange, newName, setNewName, newPrice, setNewPrice, newStock, setNewStock,
    newCategory, setNewCategory, newDescription, setNewDescription, newFit, setNewFit, newGsm,
    setNewGsm, newMadeIn, setNewMadeIn, newMaterial, setNewMaterial, newCare, setNewCare,
    newSleeve, setNewSleeve, newPattern, setNewPattern, newOccasion, setNewOccasion, newSizes,
    setNewSizes, newColors, setNewColors, newDetails, setNewDetails, mediaPreviews, uploadingMedia,
    stockFilter, setStockFilter, dateSort, setDateSort, priceSort, setPriceSort, startDate, setStartDate,
    endDate, setEndDate, minPrice, setMinPrice, maxPrice, setMaxPrice, notification, deleteConfirmConfig,
    setDeleteConfirmConfig, isConfirmedChecked, setIsConfirmedChecked, handleConfirmDeleteAction
  };
}
