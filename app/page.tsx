// app/page.tsx (আপডেট)
'use client'; // Client component হিসেবে স্টেট হ্যান্ডেল করতে হবে
import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';

// ... (আপনার আগের fs এবং path লজিক এখানে রাখুন)

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  // আপনার ম্যাপিং লজিকের ভেতরে 'bio' এবং 'fullDetails' যোগ করুন
  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    // এখন ফাইল থেকে Name, Price, Bio, Details ট্র্যাক করা হচ্ছে
    const getVal = (key: string) => content.match(new RegExp(`${key}: (.*)`))?.[1] || '';
    
    return {
      id: file.replace('.txt', ''),
      title: getVal('Name'),
      price: getVal('Price'),
      bio: getVal('Bio'),
      fullDetails: content.split('Details:')[1]?.trim(), // Details-এর পরের সবটুকু তথ্য
      image: `/images/${matchedImage}`
    };
  });

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard 
            key={p.id} 
            {...p} 
            onDetailsClick={() => setSelectedProduct(p)} 
          />
        ))}
      </div>
      
      {/* মোডাল রেন্ডার */}
      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
}
