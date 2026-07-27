import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { UserProfileModal } from '../components/auth/UserProfileModal';

export const AdminDashboard = () => {
  const { userProfile, loading } = useUserProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 font-mono flex items-center justify-center text-sm tracking-widest">
        INITIALIZING CYBER DOCK...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex font-sans">
      
      {/* 🟢 ১. বাম পাশের সাইডবার (Sidebar Menu) */}
      <aside className="w-64 border-r border-neutral-800 bg-black p-6 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-black tracking-widest text-white">NOMAD</h1>
            <p className="text-[10px] text-neutral-400 font-mono tracking-wider">The one. Everywhere.</p>
          </div>

          <nav className="space-y-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'overview'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              OVERVIEW & ANALYTICS
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'orders'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              ORDER MANAGEMENT
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'products'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              PRODUCTS & STOCK
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left py-2.5 px-3 rounded transition-all font-bold tracking-wider ${
                activeTab === 'settings'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              ROLES & SETTINGS
            </button>
          </nav>
        </div>
      </aside>

      {/* 🟢 ২. ডান পাশের মূল ড্যাশবোর্ড কন্টেন্ট */}
      <main className="flex-1 p-8 bg-[#0a0a0a] overflow-y-auto">
        
        {/* হেডার বার (ইউজার প্রোফাইল বাটন সহ) */}
        <header className="flex justify-end mb-8">
          <div
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-end cursor-pointer p-2 px-3 rounded bg-neutral-900/80 border border-neutral-800 hover:border-cyan-500/50 transition-all"
            title="Click to view Cyber Profile"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wider">
                {userProfile?.full_name || 'OPERATOR'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5 tracking-wider">
              ROLE: <span className="text-cyan-400 font-semibold uppercase">{userProfile?.role || 'SUPER ADMIN'}</span>
            </div>
          </div>
        </header>

        {/* ট্যাব অনুযায়ী কন্টেন্ট প্রদর্শন */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">HQ METRICS & OVERVIEW</h2>
              <p className="text-xs text-neutral-400 font-mono tracking-wider mt-0.5">
                REAL-TIME FINANCIAL & FULFILLMENT INSIGHTS
              </p>
            </div>

            {/* ৪টি কার্ড */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-400 tracking-wider">TOTAL REVENUE</span>
                <p className="text-2xl font-bold text-emerald-400 my-1">৳ 1,360</p>
                <span className="text-[10px] text-neutral-400 font-mono">* EXCLUDING CANCELLED</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-400 tracking-wider">TOTAL ORDERS</span>
                <p className="text-2xl font-bold text-white my-1">1</p>
                <span className="text-[10px] text-neutral-400 font-mono">* ALL-TIME LOGGED</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-400 tracking-wider">ACTIVE QUEUE</span>
                <p className="text-2xl font-bold text-purple-400 my-1">0 <span className="text-sm font-normal text-neutral-400">/ 0 REC</span></p>
                <span className="text-[10px] text-neutral-400 font-mono">* PENDING & PROCESSING</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded">
                <span className="text-[11px] font-mono text-neutral-400 tracking-wider">CATALOG ITEMS</span>
                <p className="text-2xl font-bold text-white my-1">3</p>
                <span className="text-[10px] text-neutral-400 font-mono">* LIVE IN STORE</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-white font-mono text-sm">
            <h2 className="text-lg font-bold mb-2">ROLES & PERMISSION SETTINGS</h2>
            <p className="text-xs text-neutral-400">Manage Granular Access Control Here.</p>
          </div>
        )}

        {/* ৩. প্রোফাইল মডাল */}
        <UserProfileModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          profile={userProfile} 
        />
      </main>
    </div>
  );
};
