import React from 'react';

interface ProfileDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  avatarUrl: string | null;
  getInitials: (name?: string, email?: string) => string;
  isAmbassador: boolean;
}

export default function ProfileDetailsSheet({
  isOpen,
  onClose,
  profile,
  avatarUrl,
  getInitials,
  isAmbassador
}: ProfileDetailsSheetProps) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#0F0F0F',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          border: '1px solid #27272A',
          borderBottom: 'none',
          padding: '20px 24px 32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* ড্র্যাগ বার */}
        <div style={{
          width: '36px',
          height: '4px',
          backgroundColor: '#3F3F46',
          borderRadius: '2px',
          margin: '0 auto'
        }} />

        {/* হেডার */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#18181B',
            border: '1px solid #3F3F46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '600',
            color: '#FFF',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(profile?.name, profile?.email)
            )}
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: '#FFFFFF' }}>
              {profile?.name || "User Profile"}
            </h3>
            <span style={{ 
              fontSize: '11px', 
              color: isAmbassador ? '#10B981' : '#A1A1AA', 
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              {isAmbassador ? '★ Nomad Ambassador' : 'Verified Customer'}
            </span>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#27272A', width: '100%' }} />

        {/* ডিটেইলস */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
              Email Address
            </span>
            <span style={{ fontSize: '14px', color: '#E4E4E7', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {profile?.email || 'N/A'}
            </span>
          </div>

          {profile?.phone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                Phone Number
              </span>
              <span style={{ fontSize: '14px', color: '#E4E4E7' }}>
                {profile.phone}
              </span>
            </div>
          )}
        </div>

        {/* ক্লোজ বাটন */}
        <button 
          onClick={onClose}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
