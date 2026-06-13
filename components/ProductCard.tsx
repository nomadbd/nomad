'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details, id }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-800 w-full mb-8 rounded-xl overflow-hidden">
      {image && <img src={image} alt={title} className="w-full h-auto" />}
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{title || "Untitled Product"}</h3>
        <p className="text-zinc-400 text-sm mb-6">{bio || ""}</p>
        
        <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
          <span className="text-white font-bold text-lg">{price || 0} BDT</span>
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="bg-white text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-zinc-200"
          >
            Order Now
          </button>
        </div>
      </div>

      {isFormOpen && (
        <OrderForm 
          product={{ title, price, id }} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
