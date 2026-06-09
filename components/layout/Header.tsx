'use client';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [search, setSearch] = useState('');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col items-center">
          <Link href="/" className="text-5xl font-serif tracking-[4px] font-bold">NOMAD</Link>
          <p className="text-sm tracking-widest text-gray-500 mt-1">The one. Everywhere.</p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="প্রোডাক্ট সার্চ করুন..."
              className="w-full pl-12 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-black text-sm"
            />
            <Search className="absolute left-5 top-4 text-gray-400" size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}