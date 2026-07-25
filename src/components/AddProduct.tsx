import React, { useState } from 'react';
import { uploadToCloudinary } from '../cloudinary';
import { supabase } from '../supabaseClient';

export default function AddProduct() {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('0');
  const [sizes, setSizes] = useState<string>('S, M, L, XL'); // কমা দিয়ে আলাদা
  const [colors, setColors] = useState<string>('BLACK, WHITE'); // কমা দিয়ে আলাদা
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

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

      alert('প্রোডাক্ট এবং ছবি সফলভাবে সেভ হয়েছে!');

      // ফর্ম রিসেট
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setStockQuantity('0');
      setImageFiles(null);
    } catch (err: any) {
      alert('সমস্যা হয়েছে: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Product Name:</label>
          <input
            type="text"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Description:</label>
          <textarea
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Price ($):</label>
          <input
            type="number"
            step="0.01"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Category:</label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Stock Quantity:</label>
          <input
            type="number"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Sizes (Comma separated):</label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Colors (Comma separated):</label>
          <input
            type="text"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={colors}
            onChange={(e) => setColors(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Product Images:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ width: '100%', marginTop: '4px' }}
            onChange={(e) => setImageFiles(e.target.files)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {uploading ? 'Uploading & Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}
