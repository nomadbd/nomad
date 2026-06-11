'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full">
      {image && (
        <div className="w-full">
          <img src={image} alt={title} className="w-full object-cover" />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        <div className="text-zinc-300 text-sm leading-relaxed">
          {isExpanded ? (
            <div className="mt-2 mb-4 space-y-1">
              {fullDetails.split('\n').map((line: string, index: number) => {
                // শুরুতে থাকা হাইফেন বা স্পেস সরিয়ে ফেলা
                const cleanLine = line.replace(/^[-–]\s*/, '').trim();
                if (!cleanLine) return null;

                const colonIndex = cleanLine.indexOf(':');

                if (colonIndex !== -1) {
                  const label = cleanLine.substring(0, colonIndex).trim();
                  const value = cleanLine.substring(colonIndex + 1).trim();
                  
                  return (
                    <div key={index} className="flex">
                      {/* লেবেলকে একটি ফিক্সড উইডথ দিয়ে দেওয়া হয়েছে যাতে কোলন সোজাসুজি থাকে */}
                      <span className="font-semibold text-zinc-400 w-20 shrink-0">
                        {label}
                      </span>
                      <span className="text-white flex-1">
                        : {value}
                      </span>
                    </div>
                  );
                }
                return <p key={index} className="text-white font-medium my-1">{cleanLine}</p>;
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
