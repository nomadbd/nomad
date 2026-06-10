// Path: components/ProductList.tsx
'use client';
import { useState } from 'react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';

export default function ProductList({ initialProducts }: any) {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {initialProducts.map((p: any) => (
          <ProductCard key={p.id} {...p} onDetailsClick={() => setSelectedProduct(p)} />
        ))}
      </div>
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
