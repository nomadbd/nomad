'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ডিটেইলস প্রসেস করার জন্য একটি নিরাপদ ফাংশন
  const renderDetails = () => {
    if (!fullDetails) return null;

    return fullDetails.split('\n').map((line: string, index: number) => {
      // 'Details:' লাইনটি এড়িয়ে চলুন
      if (line.trim().toLowerCase() === 'details:') return null;
      
      const cleanLine = line.trim();
      if (!cleanLine) return null;

      // কোলন থাকলে আলাদা করুন, না থাকলে সাধারণ টেক্সট দেখান
      if (cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.split(':');
        return (
          <div key={index} className="flex gap-2 items-start">
            <span className="font-semibold text-zinc-400 min-w-[80px] shrink-0">
              {label.trim()}
            </span>
            <span className="text-white">
              : {valueParts.join(':').trim()}
            </span>
          </div>
        );
      }
      
      return <p key={index} className="text-white font-medium my-1">{cleanLine}</p>;
    });
  };

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full overflow-hidden">
      {image && <img src={image} alt={title} className="w-full object-cover" />}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="text-zinc-300 text-sm leading-relaxed">
          {isExpanded ? (
            <div className="mt-2 mb-4 space-y-1">{renderDetails()}</div>
          ) : (
            <p className="mb-4">
              {bio}{' '}
              <span onClick={() => setIsExpanded(true)} style={{ color: '#71717a' }} className="cursor-pointer font-medium hover:text-white ml-1">
                ...See more
              </span>
            </p>
          )}
          {isExpanded && (
            <span onClick={() => setIsExpanded(false)} style={{ color: '#71717a' }} className="cursor-pointer font-medium hover:text-white block mb-4">
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
