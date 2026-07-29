import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface StaffProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onRefreshProfile: () => void;
}

export default function StaffProfile({ isOpen, onClose, profile, onRefreshProfile }: StaffProfileProps) {
  const [name, setName] = useState(profile?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);

  if (!isOpen) return null;

  const showToast = (message: string, color: string = '#fff') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  };

  // তারিখ ফরম্যাট করার ফাংশন (যেমন: 15 Jan, 2024)
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // কত বছর/মাস ধরে কাজ করছেন তা হিসাব করার ফাংশন
  const calculateTenure = (startDateString?: string) => {
    if (!startDateString) return 'N/A';
    const start = new Date(startDateString);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0 && months === 0) return 'Joined this month';
    if (years === 0) return `${months} month${months > 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
  };

  // রোলের নাম ফরম্যাট করা
  const formatRole = (role?: string) => {
    if (!role) return 'STAFF';
    return role.replace('_', ' ').toUpperCase();
  };

  // আপডেট হ্যান্ডলার (নাম ও পাসওয়ার্ড)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let isUpdated = false;

      // ১. নাম আপডেট
      if (name.trim() && name !== profile?.name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: name.trim() })
          .eq('id', profile.id);
        if (profileError) throw profileError;
        isUpdated = true;
      }

      // ২. পাসওয়ার্ড আপডেট
      if (password) {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        const { error: passError } = await supabase.auth.updateUser({ password });
        if (passError) throw passError;
        isUpdated = true;
      }

      if (isUpdated) {
        showToast("Profile updated successfully!", "#2ecc71");
        setPassword('');
        onRefreshProfile();
      } else {
        showToast("No changes were made.", "#aaa");
      }
    } catch (err: any) {
      showToast("Error: " + err.message, "#ff4444");
    } finally {
      setLoading(false);
    }
  };

  // সাইন আউট হ্যান্ডলার
  const handleSignOut = async () => {
    localStorage.removeItem('currentView');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #333',
    color: '#fff',
    marginBottom: '15px',
    outline: 'none',
    fontSize: '13px'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      zIndex: 99999
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #222',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '420px',
        padding: '30px',
        boxSizing: 'border-box',
        color: '#fff',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.9)'
      }}>
        
        {/* টোস্ট মেসেজ */}
        {toast && (
          <div style={{
            position: 'absolute',
            top: '-45px',
            left: 0,
            right: 0,
            background: '#1a1a1a',
            color: '#fff',
            padding: '10px 15px',
            borderRadius: '6px',
            borderLeft: `4px solid ${toast.color}`,
            fontSize: '11px',
            textAlign: 'center'
          }}>
            {toast.message}
          </div>
        )}

        {/* ক্লোজ (X) বাটন */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#666', fontSize: '18px', cursor: 'pointer' }}
        >
          ✕
        </button>

        {/* ----------------- ১. হেডার ও বেসিক ইনফো ----------------- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: '#222',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#3498db'
          }}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px' }}>
              {profile?.name || 'Staff User'}
            </h3>
            <p style={{ margin: '2px 0 6px 0', fontSize: '12px', color: '#888' }}>
              {profile?.email}
            </p>
            <span style={{
              background: '#1a2634',
              color: '#3498db',
              fontSize: '9px',
              padding: '3px 8px',
              borderRadius: '4px',
              letterSpacing: '1px',
              fontWeight: 'bold',
              border: '1px solid #2c3e50'
            }}>
              {formatRole(profile?.role)}
            </span>
          </div>
        </div>

        {/* ----------------- ২. বিস্তারিত তথ্য (Joining & Tenure) ----------------- */}
        <div style={{
          background: '#0a0a0a',
          border: '1px solid #1e1e1e',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '25px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <div>
            <p style={{ margin: '0 0 3px 0', fontSize: '10px', color: '#666', letterSpacing: '1px' }}>ACCOUNT CREATED</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#ddd', fontWeight: '500' }}>
              {formatDate(profile?.created_at)}
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 3px 0', fontSize: '10px', color: '#666', letterSpacing: '1px' }}>ROLE ASSIGNED</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#ddd', fontWeight: '500' }}>
              {/* যদি ডাটাবেজে role_assigned_at থাকে সেটা দেখাবে, না থাকলে created_at দেখাবে */}
              {formatDate(profile?.role_assigned_at || profile?.created_at)}
            </p>
          </div>

          <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #222', paddingTop: '10px', marginTop: '5px' }}>
            <p style={{ margin: '0 0 3px 0', fontSize: '10px', color: '#666', letterSpacing: '1px' }}>TOTAL TENURE (SERVICE TIME)</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#2ecc71', fontWeight: '600' }}>
              {calculateTenure(profile?.created_at)}
            </p>
          </div>
        </div>

        {/* ----------------- ৩. পাসওয়ার্ড পরিবর্তন ও সেটিংস ফর্ম ----------------- */}
        <form onSubmit={handleUpdate}>
          <p style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', margin: '0 0 4px 0' }}>UPDATE DISPLAY NAME</p>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={inputStyle} 
            placeholder="Enter full name" 
          />

          <p style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', margin: '0 0 4px 0' }}>CHANGE PASSWORD</p>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={inputStyle} 
            placeholder="Enter new password (min 6 chars)" 
          />

          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
            </button>

            {/* ----------------- ৪. সাইন আউট অপশন ----------------- */}
            <button 
              type="button" 
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                color: '#ff4444',
                border: '1px solid #ff444433',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer',
                marginTop: '5px'
              }}
            >
              SIGN OUT
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
