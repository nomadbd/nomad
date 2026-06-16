import React, { useState } from 'react';
import SearchOverlay from './SearchOverlay';
import AuthModal from './auth/AuthModal'; // একটি Wrapper বা মডাল কম্পোনেন্ট

const Header: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <header style={{ /* আপনার হেডার স্টাইল */ }}>
         {/* আইকনগুলো এখানে ক্লিক হ্যান্ডেলারসহ */}
         <button onClick={() => setIsSearchOpen(true)}>Search</button>
         <button onClick={() => setIsAuthOpen(true)}>Profile</button>
      </header>

      {/* এগুলো সরাসরি এখানেই থাকবে, App.tsx এ যাওয়ার দরকার নেই */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
