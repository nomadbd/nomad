import React, { useState, useRef } from 'react';
import { uploadToCloudinary } from '../cloudinary';
import { supabase } from '../supabaseClient';

export default function AddProduct() {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('0');
  const [sizes, setSizes] = useState<string>('S, M, L, XL');
  const [colors, setColors] = useState<string>('BLACK, WHITE');
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  
  // ফাইল ইনপুট রিসেট করার জন্য রিফ
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFiles || imageFiles.length === 0) {
      alert('কমপক্ষে একটি ছবি সিলেক্ট করুন');
      return;
    }

    setUploading(true);

    try {
      // ১. Cloudinary-তে ছবিগুলো আপলোড করা
      const uploadPromises = Array.from(imageFiles).map((file) =>
        uploadToCloudinary(file)
      );
      const imageUrls = await Promise.all(uploadPromises);

      // ২. 'products' টেবিলে নতুন প্রোডাক্ট ইনসার্ট করা
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([
          {
            name,
            description,
            price: parseFloat(price),
            category,
            stock_quantity: parseInt(stockQuantity, 10),
            status: 'active',
            sizes: sizes.split(',').map((s) => s.trim()).filter(Boolean),
            colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
          },
        ])
        .select()
        .single();

      if (productError) throw productError;

      // ৩. 'product_media' টেবিলে ছবির URL গুলো যুক্ত করা
      const mediaRows = imageUrls.map((url, index) => ({
        product_id: productData.id,
        media_url: url,
        media_type: 'image',
        sort_order: index,
      }));

      const { error: mediaError } = await supabase
        .from('product_media')
        .insert(mediaRows);

      if (mediaError) throw mediaError;

      alert('🎉 প্রোডাক্ট এবং ছবি সফলভাবে সেভ হয়েছে!');

      // ফর্ম রিসেট
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setStockQuantity('0');
      setImageFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // ফাইল ইনপুট ক্লিয়ার
    } catch (err: any) {
      alert('সমস্যা হয়েছে: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ডার্ক ইনপুট ফিল্ডের কমন স্টাইল
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    marginTop: '6px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '24px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#38bdf8' }}>🛍️ নতুন প্রোডাক্ট যোগ করুন</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Product Name:</label>
          <input
            type="text"
            required
            placeholder="e.g. Classic Black T-Shirt"
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Description:</label>
          <textarea
            rows={3}
            placeholder="Write product description..."
            style={{ ...inputStyle, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Price (৳):</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              style={inputStyle}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Stock Quantity:</label>
            <input
              type="number"
              style={inputStyle}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Category:</label>
          <input
            type="text"
            placeholder="e.g. T-Shirts, Hoodies"
            style={inputStyle}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Sizes (Comma separated):</label>
            <input
              type="text"
              style={inputStyle}
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Colors (Comma separated):</label>
            <input
              type="text"
              style={inputStyle}
              value={colors}
              onChange={(e) => setColors(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Product Images:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            style={{ ...inputStyle, padding: '8px', cursor: 'pointer' }}
            onChange={(e) => setImageFiles(e.target.files)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: uploading ? '#475569' : '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '15px'
          }}
        >
          {uploading ? '⏳ Uploading to Cloudinary & Saving...' : '💾 Save Product'}
        </button>
      </form>
    </div>
  );
}
