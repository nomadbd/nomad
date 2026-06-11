'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full">
      {image && <img src={image} alt={title} className="w-full object-cover" />}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>

        <div className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {isExpanded ? (
            <div className="space-y-1 mt-2">
              {fullDetails.split('\n').map((line: string, index: number) => (
                <div key={index} className="flex">
                  {line.includes(':') ? (
                    <>
                      <span className="font-bold text-white w-20 shrink-0">{line.split(':')[0]}:</span>
                      <span>{line.split(':')[1]}</span>
                    </>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>{bio}</p>
          )}

          <span 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ color: '#71717a' }}
            className="cursor-pointer font-medium hover:text-white transition block mt-3"
          >
            {isExpanded ? 'See less' : '...See more'}
          </span>
        </div>

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
