import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AddProduct from '../components/AddProduct';

interface AdminDashboardProps {
  session: any;
  profile?: any;
  onRefreshProfile?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session, profile, onRefreshProfile }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'users' | 'settings'>('overview');

  // অ্যাকাউন্ট সেটিংসের জন্য স্টেট
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      setNewName(profile.name || '');
      setNewEmail(profile.email || session?.user?.email || '');
    }
  }, [profile, session]);

  const showToast = (message: string, color: string = '#38bdf8') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 4000);
  };

  // সাইন আউট হ্যান্ডলার
  const handleSignOut = async () => {
    localStorage.removeItem('currentView');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // অ্যাকাউন্ট ডিলিট হ্যান্ডলার
  const handleDeleteAccount = async () => {
    setShowConfirm(false);
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      localStorage.removeItem('currentView');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      showToast('ত্রুটি: ' + err.message, '#ef4444');
    }
  };

  // প্রোফাইল ও পাসওয়ার্ড আপডেট হ্যান্ডলার
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let emailChanged = false;
      let otherChanges = false;

      // ১. নাম আপডেট
      if (newName && newName !== profile?.name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: newName })
          .eq('id', session?.user?.id || profile?.id);
        if (profileError) throw profileError;
        otherChanges = true;
      }

      // ২. ইমেইল আপডেট
      if (newEmail && newEmail !== (profile?.email || session?.user?.email)) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
        if (emailError) throw emailError;
        emailChanged = true;
      }

      // ৩. পাসওয়ার্ড আপডেট
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        otherChanges = true;
      }

      if (emailChanged) {
        showToast('আপনার নতুন ইমেইলে ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। লিঙ্কটি কনফার্ম করুন।', '#38bdf8');
      } else if (otherChanges) {
        showToast('🎉 আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে!', '#22c55e');
      }

      setNewPassword('');
      if (onRefreshProfile) onRefreshProfile();
    } catch (err: any) {
      showToast('সমস্যা হয়েছে: ' + err.message, '#ef4444');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    marginTop: '6px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      
      {/* নোটিফিকেশন টোস্ট */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#1e293b', color: '#fff', padding: '14px 20px', borderRadius: '8px', borderLeft: `5px solid ${toast.color}`, zIndex: 9999, fontSize: '13px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          {toast.message}
        </div>
      )}

      {/* অ্যাকাউন্ট ডিলিট কনফার্মেশন মডাল */}
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid #334155', maxWidth: '360px', color: '#fff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#ef4444' }}>⚠️ অ্যাকাউন্ট মুছে ফেলার তাগিদ</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>আপনি কি নিশ্চিত যে আপনার এই অ্যাডমিন অ্যাকাউন্টটি চিরতরে ডিলিট করতে চান?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleDeleteAccount} style={{ backgroundColor: '#ef4444', border: 'none', padding: '10px 20px', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>হ্যাঁ, ডিলিট করুন</button>
              <button onClick={() => setShowConfirm(false)} style={{ backgroundColor: 'transparent', border: '1px solid #475569', padding: '10px 20px', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* সাইডবার (Sidebar) */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#38bdf8' }}>
            অ্যাডমিন প্যানেল
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>
            {profile?.name || session?.user?.email}
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

          {/* ⚡ নতুন অ্যাকাউন্ট সেটিংস ট্যাব */}
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: activeTab === 'settings' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontWeight: activeTab === 'settings' ? '600' : 'normal'
            }}
          >
            ⚙️ অ্যাকাউন্ট সেটিংস
          </button>
        </nav>

        {/* সাইডবারের নিচের অংশ */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>
            ← ওয়েবসাইটে ফিরে যান
          </Link>
          <button
            onClick={handleSignOut}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', padding: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            🚪 সাইন আউট (Sign Out)
          </button>
        </div>
      </aside>

      {/* মূল কনটেন্ট এরিয়া (Main Content) */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
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
            <AddProduct />
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>ইউজার ও ম্যানেজার এক্সেস কন্ট্রোল</h1>
            <p style={{ color: '#94a3b8', marginTop: '8px' }}>ইমেইল দিয়ে ইউজারদের রোল পরিবর্তন এবং এক্সেস দেওয়ার সেকশন।</p>
          </div>
        )}

        {/* ⚡ অ্যাকাউন্ট সেটিংস সেকশন */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#38bdf8' }}>
              ⚙️ অ্যাডমিন অ্যাকাউন্ট সেটিংস
            </h2>

            <form onSubmit={handleUpdateSettings}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8' }}>অ্যাডমিন নাম (Name):</label>
                <input
                  type="text"
                  placeholder="আপনার নাম লিখুন"
                  style={inputStyle}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8' }}>অ্যাডমিন ইমেইল (Email):</label>
                <input
                  type="email"
                  placeholder="আপনার ইমেইল লিখুন"
                  style={inputStyle}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', color: '#94a3b8' }}>নতুন পাসওয়ার্ড (New Password):</label>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড পরিবর্তন করতে চাইলে লিখুন"
                  style={inputStyle}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: saving ? '#475569' : '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  marginBottom: '24px'
                }}
              >
                {saving ? '⏳ সেভ হচ্ছে...' : '💾 পরিবর্তন সেভ করুন'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}> বিপদজনক এলাকা (Danger Zone)</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>আপনার অ্যাকাউন্টটি ডাটাবেজ থেকে মুছে ফেললে আর রিকভার করা সম্ভব নয়।</p>
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                🗑️ অ্যাকাউন্ট ডিলিট করুন
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
