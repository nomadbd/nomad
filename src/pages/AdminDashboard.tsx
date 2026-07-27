import React from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { Header } from './Header'; // আপনার হেডার কম্পোনেন্ট
import { UserProfileModal } from '../components/auth/UserProfileModal';

export const AdminDashboard = () => {
  // 🟢 আগে যেখানে ১০-১৫ লাইনের useEffect ছিল, তা এখন এক লাইনে!
  const { userProfile, loading, refetchProfile } = useUserProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#a3a3a3] flex items-center justify-center">
        <p className="animate-pulse text-cyan-400 font-mono">LOADING SYSTEM PROFILES...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d4d4d4]">
      {/* ১. হেডারে প্রোফাইল ডাটা পাস করা */}
      <Header profile={userProfile} />

      <main className="p-6">
        {/* ড্যাশবোর্ডের মূল কন্টেন্ট */}
        <h1 className="text-2xl font-bold text-white mb-4">Cyberpunk Admin Panel</h1>
        
        {/* এখানে অন্যান্য কার্ড বা চার্ট থাকবে */}
      </main>
    </div>
  );
};
