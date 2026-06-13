'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details, id }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // বায়োর দৈর্ঘ্য ১০০ ক্যারেক্টারের বেশি হলে ট্রানকেট করা হবে
  const shouldTruncate = bio && bio.length > 100;
  const displayBio = isExpanded ? bio : (shouldTruncate ? `${bio.substring(0, 100)}...` : bio);

  return (
    <div className="bg-zinc-900 border border-zinc-800 w-full mb-8 rounded-xl overflow-hidden shadow-lg">
      {/* প্রোডাক্ট ইমেজ */}
      {image && <img src={image} alt={title} className="w-full h-auto object-cover" />}
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-white mb-2">{title || "Untitled Product"}</h3>
        
        {/* Bio এবং See more/less লজিক */}
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          {displayBio}
          {shouldTruncate && (
            <span 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-white font-bold cursor-pointer ml-1 hover:underline"
            >
              {isExpanded ? ' See less' : ' See more'}
            </span>
          )}
        </p>
        
        <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
          <span className="text-white font-bold text-lg">{price || 0} BDT</span>
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="bg-white text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition"
          >
            Order Now
          </button>
        </div>
      </div>

      {/* অর্ডার মোডাল */}
      {isFormOpen && (
        <OrderForm 
          product={{ title, price, id }} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
