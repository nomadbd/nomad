'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details, id }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full mb-8 overflow-hidden">
      {image && <img src={image} alt={title} className="w-full object-cover" />}
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-300 text-sm">{bio}</p>
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800">
          <span className="text-white font-bold text-lg">{price} BDT</span>
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="border border-white text-white px-6 py-2 uppercase font-bold text-xs hover:bg-white hover:text-black transition"
          >
            ORDER NOW
          </button>
        </div>
      </div>

      {isFormOpen && (
        <OrderForm 
          product={{ 
            title, 
            price, 
            id, 
            category: details?.Category || 'General', 
            size: details?.Size 
          }} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
