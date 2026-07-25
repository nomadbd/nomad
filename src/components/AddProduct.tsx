import React, { useState } from 'react';
import { uploadToCloudinary } from '../cloudinary';
import { supabase } from '../supabaseClient';

export default function AddProduct() {
  const [title, setTitle] = useState<string>('');
  const [price, setPrice] = useState<string>('');
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
      // ১. Cloudinary-তে ছবিগুলো আপলোড
      const uploadPromises = Array.from(imageFiles).map((file) =>
        uploadToCloudinary(file)
      );
      const imageUrls = await Promise.all(uploadPromises);

      // ২. Supabase-এ ডাটা পাঠানো (ইউটিউব লিংক ছাড়া)
      const productData = {
        title,
        price: parseFloat(price),
        images: imageUrls,
      };

      const { error } = await supabase.from('products').insert([productData]);
      if (error) throw error;

      alert('প্রোডাক্ট সফলভাবে যুক্ত হয়েছে!');

      // ফর্ম রিসেট
      setTitle('');
      setPrice('');
      setImageFiles(null);
    } catch (err: any) {
      alert('সমস্যা হয়েছে: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Product Title:</label>
          <input
            type="text"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Price ($):</label>
          <input
            type="number"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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

        <button type="submit" disabled={uploading} style={{ padding: '10px 15px', cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}
