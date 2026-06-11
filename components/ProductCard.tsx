'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full">
      {/* ইমেজ */}
      {image && <img src={image} alt={title} className="w-full object-cover" />}

      {/* কন্টেন্ট */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>

        <div className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {/* বিস্তারিত অংশ */}
          {isExpanded ? (
            <div className="space-y-1.5 mt-2">
              {fullDetails.split('\n').map((line: string, index: number) => {
                const parts = line.split(':');
                const label = parts[0];
                const value = parts.slice(1).join(':');

                return (
                  <div key={index} className="flex items-start">
                    {value ? (
                      <>
                        <span className="font-semibold text-zinc-400 w-24 shrink-0">
                          {label}
                        </span>
                        <span className="text-white">: {value.trim()}</span>
                      </>
                    ) : (
                      <span className="text-white font-medium">{line}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* বায়ো অংশ */
            <p>
              {bio}{' '}
              <span 
                onClick={() => setIsExpanded(true)}
                style={{ color: '#71717a' }}
                className="cursor-pointer font-medium hover:text-white"
              >
                ...See more
              </span>
            </p>
          )}

          {/* See less বাটন */}
          {isExpanded && (
            <span 
              onClick={() => setIsExpanded(false)}
              style={{ color: '#71717a' }}
              className="cursor-pointer font-medium hover:text-white block mt-3"
            >
              See less
            </span>
          )}
        </div>

        {/* প্রাইস এবং বাটন */}
        <div className="mt-4 flex items-center justify-between w-full">
          <span className="text-white font-bold text-lg">Price: {price} BDT</span>
          <button className="border border-white text-white px-5 py-2 text-xs font-bold transition hover:bg-white hover:text-black rounded">
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
