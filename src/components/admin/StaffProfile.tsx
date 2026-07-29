import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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

  const formatRole = (role?: string) => {
    if (!role) return 'STAFF';
    return role.replace('_', ' ').toUpperCase();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let isUpdated = false;

      if (name.trim() && name !== profile?.name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: name.trim() })
          .eq('id', profile.id);
        if (profileError) throw profileError;
        isUpdated = true;
      }

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

  const handleSignOut = async () => {
    localStorage.removeItem('currentView');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100dvh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #222222',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '420px',
        padding: '24px 20px',
        boxSizing: 'border-box',
        color: '#fff',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.95)',
        maxHeight: '90dvh',
        overflowY: 'auto'
      }}>

        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '20px',
            right: '20px',
            background: '#1a1a1a',
            color: '#fff',
            padding: '10px 15px',
            borderRadius: '4px',
            borderLeft: `4px solid ${toast.color}`,
            fontSize: '11px',
            textAlign: 'center',
            zIndex: 10
          }}>
            {toast.message}
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '18px', 
            right: '18px', 
            background: '#181818', 
            border: '1px solid #333', 
            borderRadius: '4px',
            color: '#888', 
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px', 
            cursor: 'pointer' 
          }}
        >
          ✕
        </button>

        {/* 1. Header & Identity Block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px', paddingRight: '36px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#161616',
            border: '1px solid #333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff',
            flexShrink: 0
          }}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px', color: '#fff' }}>
              {profile?.name || 'Staff User'}
            </h3>
            <p style={{ margin: '3px 0 6px 0', fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.email}
            </p>
            <span style={{
              background: '#181818',
              color: '#3498db',
              fontSize: '9px',
              padding: '3px 8px',
              borderRadius: '2px',
              letterSpacing: '1px',
              fontWeight: 'bold',
              border: '1px solid #283848',
              display: 'inline-block'
            }}>
              {formatRole(profile?.role)}
            </span>
          </div>
        </div>

        {/* 2. Tenure & Meta Data Card */}
        <div style={{
          background: '#050505',
          border: '1px solid #1c1c1c',
          borderRadius: '4px',
          padding: '14px',
          marginBottom: '22px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#666', letterSpacing: '1px', fontWeight: 600 }}>ACCOUNT CREATED</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#dddddd', fontWeight: '500' }}>
              {formatDate(profile?.created_at)}
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#666', letterSpacing: '1px', fontWeight: 600 }}>ROLE ASSIGNED</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#dddddd', fontWeight: '500' }}>
              {formatDate(profile?.role_assigned_at || profile?.created_at)}
            </p>
          </div>

          <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #1f1f1f', paddingTop: '10px', marginTop: '2px' }}>
            <p style={{ margin: '0 0 3px 0', fontSize: '9px', color: '#666', letterSpacing: '1px', fontWeight: 600 }}>TOTAL TENURE (SERVICE TIME)</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#2ecc71', fontWeight: '600' }}>
              {calculateTenure(profile?.created_at)}
            </p>
          </div>
        </div>

        {/* 3. Settings Form */}
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              UPDATE DISPLAY NAME
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter full name"
              style={{
                width: '100%',
                padding: '11px 12px',
                backgroundColor: '#111111',
                border: '1px solid #222222',
                color: '#ffffff',
                fontSize: '12px',
                borderRadius: '2px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              CHANGE PASSWORD
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter new password (min 6 chars)"
              style={{
                width: '100%',
                padding: '11px 12px',
                backgroundColor: '#111111',
                border: '1px solid #222222',
                color: '#ffffff',
                fontSize: '12px',
                borderRadius: '2px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
            </button>

            <button 
              type="button" 
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: 'transparent',
                color: '#ff4d4d',
                border: '1px solid #331111',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer'
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
