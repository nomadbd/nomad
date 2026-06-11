'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full overflow-hidden">
      {image && (
        <div className="w-full">
          <img src={image} alt={title} className="w-full object-cover" />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        <div className="text-zinc-300 text-sm leading-relaxed">
          {isExpanded ? (
            <div className="space-y-2 mt-2 mb-4">
              {fullDetails.split('\n').map((line: string, index: number) => {
                // হাইফেন বা ড্যাশ থাকলে তা সরিয়ে ফেলা হচ্ছে
                const cleanLine = line.replace(/^[-–]\s*/, ''); 
                const parts = cleanLine.split(':');
                const label = parts[0];
                const value = parts.slice(1).join(':');

                return (
                  <div key={index} className="flex items-start">
                    {value ? (
                      <>
                        <span className="font-semibold text-zinc-400 w-24 shrink-0">
                          {label.trim()}
                        </span>
                        <span className="text-white">: {value.trim()}</span>
                      </>
                    ) : (
                      <span className="text-white font-medium">{cleanLine}</span>
                    )}
                  </div>
                );
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
