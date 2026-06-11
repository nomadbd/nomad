'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, details }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full overflow-hidden">
      {image && <img src={image} alt={title} className="w-full object-cover" />}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        <div className="text-zinc-300 text-sm leading-relaxed">
          {isExpanded ? (
            <div className="mt-2 mb-4">
              {/* নিখুঁতভাবে এলাইন করার জন্য টেবিল লেআউট */}
              <div className="table w-full border-collapse">
                {Object.entries(details).map(([key, value]: [string, any], index) => (
                  <div key={index} className="table-row">
                    <div className="table-cell font-semibold text-zinc-400 pr-4 py-0.5 align-top whitespace-nowrap">
                      {key}
                    </div>
                    <div className="table-cell text-white align-top py-0.5">
                      <span className="pr-2">:</span>{value}
                    </div>
                  </div>
                ))}
              </div>
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
              className="cursor-pointer font-medium hover:text-white block mt-2 mb-4"
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
