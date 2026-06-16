import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useSession'; // হুক ইমপোর্ট
import Header from './components/Header';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const { session, loading } = useSession(); // সব লজিক এখানে
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (loading) return null; // অথবা সুন্দর কোনো লোডিং স্পিনার

  return (
    <Router>
      <Header onAuthOpen={() => session ? window.location.href = '/profile' : setIsAuthOpen(true)} />
      <AuthOverlay isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
