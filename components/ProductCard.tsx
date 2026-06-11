'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ডিটেইলস সেকশনটি টেবিল ফরম্যাটে সাজানো হয়েছে যেন কোলন সবসময় সোজাসুজি থাকে
  const renderDetails = () => {
    if (!fullDetails) return null;

    return (
      <div className="table w-full mt-2 mb-4 border-collapse">
        {fullDetails.split('\n').map((line: string, index: number) => {
          if (line.trim().toLowerCase() === 'details:') return null;
          const cleanLine = line.replace(/^[-–\s]+/, '').trim();
          if (!cleanLine) return null;

          const colonIndex = cleanLine.indexOf(':');

          if (colonIndex !== -1) {
            const label = cleanLine.substring(0, colonIndex).trim();
            const value = cleanLine.substring(colonIndex + 1).trim();

            return (
              <div key={index} className="table-row">
                <div className="table-cell font-semibold text-zinc-400 pr-2 align-top whitespace-nowrap">
                  {label}
                </div>
                <div className="table-cell text-white align-top">
                  <span className="pr-1">:</span>{value}
                </div>
              </div>
            );
          }
          return (
            <div key={index} className="table-row">
              <div className="table-cell text-white font-medium pt-2" colSpan={2}>
                {cleanLine}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full overflow-hidden">
      {image && <img src={image} alt={title} className="w-full object-cover" />}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        <div className="text-zinc-300 text-sm leading-relaxed">
          {isExpanded ? (
            <div>{renderDetails()}</div>
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
