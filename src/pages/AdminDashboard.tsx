import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface AdminDashboardProps {
  session: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'users'>('overview');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex' }}>
      {/* সাইডবার (Sidebar) */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: '24px 16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '32px', color: '#38bdf8' }}>
          অ্যাডমিন প্যানেল
        </h2>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: activeTab === 'overview' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontWeight: activeTab === 'overview' ? '600' : 'normal'
            }}
          >
            📊 ড্যাশবোর্ড ওভারভিউ
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: activeTab === 'orders' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontWeight: activeTab === 'orders' ? '600' : 'normal'
            }}
          >
            📦 অর্ডার ম্যানেজমেন্ট
          </button>

          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: activeTab === 'products' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontWeight: activeTab === 'products' ? '600' : 'normal'
            }}
          >
            🛍️ প্রোডাক্ট ও ছবি আপলোড
          </button>

          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: activeTab === 'users' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontWeight: activeTab === 'users' ? '600' : 'normal'
            }}
          >
            👥 ইউজার ও ম্যানেজার রোল
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← ওয়েবসাইটে ফিরে যান
          </Link>
        </div>
      </aside>

      {/* মূল কনটেন্ট এরিয়া (Main Content) */}
      <main style={{ flex: 1, padding: '32px' }}>
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>ড্যাশবোর্ড ওভারভিউ</h1>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>এখানে আপনার সাইটের মোট বিক্রি ও অর্ডারের সামারি থাকবে।</p>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>অর্ডার ম্যানেজমেন্ট</h1>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>গ্রাহকদের অর্ডার স্ট্যাটাস আপডেট করার সেকশন।</p>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>প্রোডাক্ট ও ছবি আপলোড (Cloudinary)</h1>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>নতুন প্রোডাক্ট যোগ করা ও ক্লাউডিনারিতে ছবি আপলোডের সেকশন।</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>ইউজার ও ম্যানেজার এক্সেস কন্ট্রোল</h1>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>ইমেইল দিয়ে ইউজারদের রোল পরিবর্তন এবং এক্সেস দেওয়ার সেকশন।</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
