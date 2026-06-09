'use client';
import { useState } from 'react';
import { Product } from '@/types/product';

export default function OrderForm({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    await fetch('/api/send-order', {
      method: 'POST',
      body: formData,
    });
    alert('অর্ডার সাবমিট হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।');
    setLoading(false);
  };

  return (
    <form action={handleSubmit} className="mt-10 space-y-6">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="productName" value={product.name} />

      <input name="name" placeholder="আপনার নাম" required className="w-full p-4 border" />
      <input name="phone" placeholder="মোবাইল নাম্বার" required className="w-full p-4 border" />
      <textarea name="address" placeholder="ডেলিভারি ঠিকানা" required className="w-full p-4 border" />

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-black text-white py-4 text-lg hover:bg-gray-900 disabled:opacity-70"
      >
        {loading ? 'প্রসেসিং...' : 'অর্ডার কনফার্ম করুন'}
      </button>

      <p className="text-center text-sm text-gray-500">
        বিকাশ / নগদ / উপায় / সেলফিন — 01521731371
      </p>
    </form>
  );
}