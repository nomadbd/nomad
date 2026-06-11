'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full">
      {image && <img src={image} alt={title} className="w-full object-cover" />}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        <div className="text-zinc-300 text-sm leading-relaxed">
          {isExpanded ? (
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mt-2 mb-4">
              {fullDetails.split('\n').map((line: string, index: number) => {
                // হাইফেন সরিয়ে ফেলা হচ্ছে
                const cleanLine = line.replace(/^[-–]\s*/, '').trim();
                if (!cleanLine) return null;

                const colonIndex = cleanLine.indexOf(':');
                
                if (colonIndex !== -1) {
                  const label = cleanLine.substring(0, colonIndex);
                  const value = cleanLine.substring(colonIndex + 1);
                  return (
                    <>
                      <span className="font-semibold text-zinc-400">{label}</span>
                      <span className="text-white">: {value.trim()}</span>
                    </>
                  );
                }
                return <span key={index} className="col-span-2 text-white font-medium">{cleanLine}</span>;
              })}
            </div>
          ) : (
            <p className="mb-4">
              {bio}{' '}
              <span 
                onClick={() => setIsExpanded(true)}
                style={{ color: '#71717a' }}
                className="cursor-pointer font-medium hover:text-white ml-1"
              >
                ...See more
              </span>
            </p>
          )}

          {isExpanded && (
            <span 
              onClick={() => setIsExpanded(false)}
              style={{ color: '#71717a' }}
              className="cursor-pointer font-medium hover:text-white block mb-4"
            >
              See less
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="text-white font-bold text-lg">Price: {price} BDT</span>
          <button className="border border-white text-white px-5 py-2 text-xs font-bold transition hover:bg-white hover:text-black rounded">
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
