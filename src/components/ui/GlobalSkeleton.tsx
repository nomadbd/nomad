import React from 'react';
import { useLocation } from 'react-router-dom';

export const GlobalSkeleton: React.FC = () => {
  const { pathname } = useLocation();

  // কমন পালস অ্যানিমেশন স্টাইল (Tailwind না থাকলেও কাজ করবে)
  const shimmerStyle: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    animation: 'skeletonPulse 1.5s infinite ease-in-out',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: '#fff', padding: '24px' }}>
      <style>
        {`
          @keyframes skeletonPulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
        `}
      </style>

      {/* ১. হোম পেজ (/) - Hero + Product Grid */}
      {pathname === '/' && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: '70px' }}>
          {/* Hero Skeleton */}
          <div style={{ ...shimmerStyle, height: '380px', width: '100%', marginBottom: '40px' }} />
          {/* Product Grid Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} style={{ ...shimmerStyle, height: '320px' }} />
            ))}
          </div>
        </div>
      )}

      {/* ২. প্রোফাইল পেজ (/profile) */}
      {(pathname === '/profile' || pathname.startsWith('/profile/')) && (
        <div style={{ maxWidth: '900px', margin: '40px auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ ...shimmerStyle, width: '80px', height: '80px', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...shimmerStyle, height: '24px', width: '200px', marginBottom: '10px' }} />
              <div style={{ ...shimmerStyle, height: '16px', width: '140px' }} />
            </div>
          </div>
          <div style={{ ...shimmerStyle, height: '250px', width: '100%' }} />
        </div>
      )}

      {/* ৩. অ্যাডমিন ড্যাশবোর্ড (/admin) */}
      {pathname.startsWith('/admin') && (
        <div style={{ display: 'flex', gap: '24px', minHeight: '90vh' }}>
          <div style={{ ...shimmerStyle, width: '240px', height: '85vh' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ ...shimmerStyle, height: '110px' }} />
              <div style={{ ...shimmerStyle, height: '110px' }} />
              <div style={{ ...shimmerStyle, height: '110px' }} />
            </div>
            <div style={{ ...shimmerStyle, flex: 1 }} />
          </div>
        </div>
      )}

      {/* ৪. অ্যাম্বাসেডর জয়েন (/vip/:token) বা পোর্টাল (/:slug) */}
      {(pathname.startsWith('/vip/') || 
        (pathname !== '/' && !pathname.startsWith('/profile') && !pathname.startsWith('/admin') && pathname !== '/update-password')) && (
        <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>
          <div style={{ ...shimmerStyle, width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 24px' }} />
          <div style={{ ...shimmerStyle, height: '32px', width: '60%', margin: '0 auto 16px' }} />
          <div style={{ ...shimmerStyle, height: '180px', width: '100%' }} />
        </div>
      )}

      {/* ৫. পাসওয়ার্ড আপডেট (/update-password) */}
      {pathname === '/update-password' && (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
          <div style={{ ...shimmerStyle, height: '300px', width: '100%' }} />
        </div>
      )}
    </div>
  );
};
