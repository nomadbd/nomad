import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

export const AdminDashboard = () => {
  const { userProfile, loading } = useUserProfile();
  // ক্লিক করলে ডিটেইলস পপ-আপ দেখানোর জন্য লোকাল স্টেট
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 font-mono flex items-center justify-center text-sm tracking-widest">
        INITIALIZING CYBER DOCK...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex font-sans relative">
      
      {/* 🟢 ১. সাইডবার (Sidebar Menu) */}
      <aside className="w-64 border-r border-neutral-800 bg-black p-6 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-black tracking-widest text-white">NOMAD</h1>
            {/* ধূসর লেখা উজ্জ্বল করা হয়েছে (text-neutral-300) */}
            <p className="text-[10px] text-neutral-300 font-mono tracking-wider">
              The one. Everywhere.
            </p>
          </div>

          <nav className="space-y-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'overview'
                  ? 'bg-white text-black'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              OVERVIEW & ANALYTICS
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'orders'
                  ? 'bg-white text-black'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              ORDER MANAGEMENT
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'products'
                  ? 'bg-white text-black'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              PRODUCTS & STOCK
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'settings'
                  ? 'bg-white text-black'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              ROLES & SETTINGS
            </button>
          </nav>
        </div>
      </aside>

      {/* 🟢 ২. মূল ড্যাশবোর্ড কন্টেন্ট */}
      <main className="flex-1 p-8 bg-[#0a0a0a] overflow-y-auto">
        
        {/* হেডার (ইমেইলের বদলে নাম + ক্লিক্যাবল বাটন) */}
        <header className="flex justify-end mb-8">
          <div
            onClick={() => setShowProfileDetails(!showProfileDetails)}
            className="group flex flex-col items-end cursor-pointer p-2 px-3 rounded bg-neutral-900/80 border border-neutral-800 hover:border-cyan-500/50 transition-all select-none"
            title="Click for Profile Details"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              {/* ইমেইলের বদলে ইউজারের নাম */}
              <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wider">
                {userProfile?.full_name || 'OPERATOR'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-neutral-300 mt-0.5 tracking-wider">
              ROLE: <span className="text-cyan-400 font-semibold uppercase">{userProfile?.role || 'SUPER ADMIN'}</span>
            </div>
          </div>
        </header>

        {/* ওভারভিউ ট্যাব কন্টেন্ট */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">HQ METRICS & OVERVIEW</h2>
              {/* সব সাবটেক্সট ধূসর থেকে উজ্জ্বল সাদাটে-ধূসর করা হয়েছে */}
              <p className="text-xs text-neutral-300 font-mono tracking-wider mt-0.5">
                REAL-TIME FINANCIAL & FULFILLMENT INSIGHTS
              </p>
            </div>

            {/* কার্ডসমূহ */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-300 tracking-wider">TOTAL REVENUE</span>
                <p className="text-2xl font-bold text-emerald-400 my-1">৳ 1,360</p>
                <span className="text-[10px] text-neutral-400 font-mono">* EXCLUDING CANCELLED</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-300 tracking-wider">TOTAL ORDERS</span>
                <p className="text-2xl font-bold text-white my-1">1</p>
                <span className="text-[10px] text-neutral-400 font-mono">* ALL-TIME LOGGED</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-300 tracking-wider">ACTIVE QUEUE</span>
                <p className="text-2xl font-bold text-purple-400 my-1">0 <span className="text-sm font-normal text-neutral-300">/ 0 REC</span></p>
                <span className="text-[10px] text-neutral-400 font-mono">* PENDING & PROCESSING</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-300 tracking-wider">CATALOG ITEMS</span>
                <p className="text-2xl font-bold text-white my-1">3</p>
                <span className="text-[10px] text-neutral-400 font-mono">* LIVE IN STORE</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 🟢 ৩. নাম এর ওপর ক্লিক করলে একই ফাইলের ভেতরের পপ-আপ (Inline Modal) */}
      {showProfileDetails && userProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f0f] border border-cyan-500/40 rounded-lg max-w-sm w-full p-6 shadow-2xl text-neutral-200 relative font-mono">
            <button 
              onClick={() => setShowProfileDetails(false)}
              className="absolute top-3 right-3 text-neutral-400 hover:text-white"
            >
              ✕
            </button>

            <div className="border-b border-neutral-800 pb-3 mb-4">
              <span className="text-[10px] text-cyan-400 tracking-widest uppercase">Operator Dossier</span>
              <h3 className="text-lg font-bold text-white uppercase">{userProfile.full_name}</h3>
              <p className="text-xs text-neutral-300">{userProfile.email}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-neutral-900 rounded border border-neutral-800">
                <span className="text-neutral-400">ROLE:</span>
                <span className="text-cyan-400 font-bold">{userProfile.role}</span>
              </div>
              <div className="flex justify-between p-2 bg-neutral-900 rounded border border-neutral-800">
                <span className="text-neutral-400">HIRED AT:</span>
                <span className="text-neutral-200">
                  {userProfile.hired_at ? new Date(userProfile.hired_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setShowProfileDetails(false)}
              className="w-full mt-5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-cyan-400 text-xs font-bold rounded"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
