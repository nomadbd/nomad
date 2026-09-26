import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/supabaseClient';

interface ProductMedia {
  media_url: string;
  sort_order: number;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  stock_quantity: number | null;
  status: string | null;
  image_url: string | null;
}

interface ProductManagerProps {
  ambassadorId: string;
  ambassadorName: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function ProductManager({
  ambassadorId,
  ambassadorName,
  onBack,
  onSuccess,
}: ProductManagerProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [initialAssignedIds, setInitialAssignedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Load Data
  useEffect(() => {
    if (ambassadorId) {
      loadProductsAndAssignments();
    }
  }, [ambassadorId]);

  const loadProductsAndAssignments = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // ১. সব অ্যাক্টিভ প্রোডাক্ট এবং তাদের ইমেজ ফেচ করা
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          category,
          stock_quantity,
          status,
          product_media (
            media_url,
            sort_order
          )
        `)
        .order('created_at', { ascending: false });

      if (prodError) throw prodError;

      // প্রোডাক্ট ফরম্যাটিং এবং প্রথম ইমেজ নেওয়ার লজিক
      const formattedProducts: ProductItem[] = (productsData || []).map((p: any) => {
        const mediaList: ProductMedia[] = p.product_media || [];
        const sortedMedia = [...mediaList].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        return {
          id: p.id,
          name: p.name || 'Unnamed Product',
          price: p.price || 0,
          category: p.category || 'Uncategorized',
          stock_quantity: p.stock_quantity ?? 0,
          status: p.status || 'active',
          image_url: sortedMedia[0]?.media_url || null,
        };
      });

      setProducts(formattedProducts);

      // Unique Categories এক্সট্র্যাক্ট করা
      const uniqueCats = Array.from(
        new Set(formattedProducts.map((p) => p.category).filter(Boolean) as string[])
      );
      setCategories(uniqueCats);

      // ২. ওই অ্যাম্বাসেডরের বর্তমান অ্যাসাইন করা প্রোডাক্ট আইডি ফেচ করা
      const { data: assignedData, error: assignError } = await supabase
        .from('ambassador_products')
        .select('product_id')
        .eq('ambassador_id', ambassadorId);

      if (assignError) throw assignError;

      const assignedSet = new Set((assignedData || []).map((item: any) => item.product_id));
      setSelectedProductIds(new Set(assignedSet));
      setInitialAssignedIds(new Set(assignedSet));
    } catch (err: any) {
      console.error('Error fetching products assignment:', err.message);
      setErrorMessage(err.message || 'Failed to load product data.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection for a single product
  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Filtered Products List Memoization
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'ALL' && prod.category !== selectedCategory) {
        return false;
      }

      // Tab filter
      const isAssigned = selectedProductIds.has(prod.id);
      if (activeTab === 'ASSIGNED' && !isAssigned) return false;
      if (activeTab === 'UNASSIGNED' && isAssigned) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesCategory = prod.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) return false;
      }

      return true;
    });
  }, [products, selectedCategory, activeTab, searchQuery, selectedProductIds]);

  // Bulk Select/Deselect visible filtered items
  const handleSelectAllFiltered = () => {
    const allFilteredSelected = filteredProducts.every((p) => selectedProductIds.has(p.id));
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredProducts.forEach((p) => next.delete(p.id));
      } else {
        filteredProducts.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  // Save changes to database
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const currentSelected = Array.from(selectedProductIds);
      const initialSelected = Array.from(initialAssignedIds);

      const toAdd = currentSelected.filter((id) => !initialAssignedIds.has(id));
      const toRemove = initialSelected.filter((id) => !selectedProductIds.has(id));

      // ১. আনচেকড প্রোডাক্টগুলো মুছে ফেলা
      if (toRemove.length > 0) {
        const { error: delError } = await supabase
          .from('ambassador_products')
          .delete()
          .eq('ambassador_id', ambassadorId)
          .in('product_id', toRemove);

        if (delError) throw delError;
      }

      // ২. নতুন চেকড প্রোডাক্টগুলো যুক্ত করা
      if (toAdd.length > 0) {
        const insertRows = toAdd.map((prodId) => ({
          ambassador_id: ambassadorId,
          product_id: prodId,
        }));

        const { error: insertError } = await supabase
          .from('ambassador_products')
          .insert(insertRows);

        if (insertError) throw insertError;
      }

      // স্টেট সিঙ্ক
      setInitialAssignedIds(new Set(selectedProductIds));
      alert('Product assignments updated successfully!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert('Failed to update product assignments: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (selectedProductIds.size !== initialAssignedIds.size) return true;
    for (let id of Array.from(selectedProductIds)) {
      if (!initialAssignedIds.has(id)) return true;
    }
    return false;
  }, [selectedProductIds, initialAssignedIds]);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ---------------- HEADER BAR ---------------- */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1f1f1f',
          backgroundColor: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: '#111',
              border: '1px solid #333',
              color: '#aaa',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            ← BACK
          </button>

          <div>
            <h1 style={{ fontSize: '15px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Assign Products
            </h1>
            <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '2px' }}>
              Ambassador: <strong style={{ color: '#64ffda' }}>{ambassadorName}</strong>
            </span>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={saving || !hasUnsavedChanges}
          style={{
            backgroundColor: hasUnsavedChanges ? '#2997ff' : '#222222',
            color: hasUnsavedChanges ? '#ffffff' : '#555555',
            border: 'none',
            padding: '8px 20px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: hasUnsavedChanges && !saving ? 'pointer' : 'not-allowed',
            borderRadius: '2px',
            letterSpacing: '1px',
            transition: 'all 0.2s ease',
          }}
        >
          {saving ? 'SAVING...' : hasUnsavedChanges ? 'SAVE CHANGES *' : 'SAVED'}
        </button>
      </div>

      {/* ---------------- FILTER & SEARCH BAR ---------------- */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* TOP SEARCH & CATEGORY ROW */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="SEARCH BY PRODUCT NAME OR CATEGORY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              backgroundColor: '#111111',
              border: '1px solid #262626',
              color: '#ffffff',
              padding: '10px 14px',
              fontSize: '11px',
              borderRadius: '2px',
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />

          {/* CATEGORY DROPDOWN */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              backgroundColor: '#111111',
              border: '1px solid #262626',
              color: '#aaaaaa',
              padding: '10px 14px',
              fontSize: '11px',
              borderRadius: '2px',
              outline: 'none',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">ALL CATEGORIES</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>

          {/* BULK SELECT BUTTON */}
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            style={{
              backgroundColor: '#161616',
              border: '1px solid #333333',
              color: '#aaaaaa',
              fontSize: '11px',
              padding: '0 16px',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            SELECT ALL VISIBLE ({filteredProducts.length})
          </button>
        </div>

        {/* TAB CONTROLS & STATS COUNTER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'ASSIGNED', 'UNASSIGNED'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    backgroundColor: isActive ? '#222222' : 'transparent',
                    color: isActive ? '#ffffff' : '#666666',
                    border: '1px solid',
                    borderColor: isActive ? '#444444' : 'transparent',
                    padding: '5px 12px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    letterSpacing: '1px',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '10px', color: '#888888', display: 'flex', gap: '14px' }}>
            <span>TOTAL: <strong style={{ color: '#fff' }}>{products.length}</strong></span>
            <span>ASSIGNED: <strong style={{ color: '#64ffda' }}>{selectedProductIds.size}</strong></span>
          </div>
        </div>
      </div>

      {/* ---------------- PRODUCT GRID ---------------- */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666666', fontSize: '11px' }}>
            LOADING PRODUCTS...
          </div>
        ) : errorMessage ? (
          <div style={{ backgroundColor: '#110505', border: '1px solid #441111', color: '#ff6b6b', padding: '14px', borderRadius: '2px', fontSize: '11px' }}>
            ERROR: {errorMessage}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#555555', fontSize: '11px', backgroundColor: '#050505', border: '1px solid #1f1f1f', borderRadius: '2px' }}>
            NO PRODUCTS FOUND MATCHING YOUR CRITERIA.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {filteredProducts.map((prod) => {
              const isChecked = selectedProductIds.has(prod.id);

              return (
                <div
                  key={prod.id}
                  onClick={() => handleToggleProduct(prod.id)}
                  style={{
                    backgroundColor: isChecked ? '#081c10' : '#050505',
                    border: `1px solid ${isChecked ? '#165e31' : '#1a1a1a'}`,
                    padding: '12px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}
                >
                  {/* CHECKBOX */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Parent div manages click
                    style={{ accentColor: '#4dff88', width: '16px', height: '16px', cursor: 'pointer' }}
                  />

                  {/* THUMBNAIL IMAGE */}
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      style={{
                        width: '44px',
                        height: '44px',
                        objectFit: 'cover',
                        borderRadius: '2px',
                        backgroundColor: '#111111',
                        border: '1px solid #222222',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        backgroundColor: '#111111',
                        border: '1px solid #222222',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#444444',
                        fontSize: '9px',
                        flexShrink: 0,
                      }}
                    >
                      NO IMG
                    </div>
                  )}

                  {/* DETAILS */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {prod.name}
                    </div>

                    <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
                      {prod.category}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64ffda', marginTop: '4px', fontWeight: 'bold' }}>
                      ৳{prod.price}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
