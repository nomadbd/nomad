import React from 'react';

interface ProfileDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  ambassadorData?: any;
  avatarUrl: string | null;
  getInitials: (name?: string, email?: string) => string;
  portalMode: 'customer' | 'ambassador';
}

export default function ProfileDetailsSheet({
  isOpen,
  onClose,
  profile,
  ambassadorData,
  avatarUrl,
  getInitials,
  portalMode
}: ProfileDetailsSheetProps) {
  if (!isOpen) return null;

  // ডাটাবেস ডাটা ও কারেন্ট মোড অনুযায়ী সত্যিকারের রোল নির্ধারণ
  const hasAmbassadorProfile = Boolean(ambassadorData) || String(profile?.role).toUpperCase().trim() === 'AMBASSADOR';
  const isAmbassadorActive = hasAmbassadorProfile && portalMode === 'ambassador';

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

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
          gap: '18px',
          maxHeight: '85vh',
          overflowY: 'auto'
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
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#18181B',
            border: isAmbassadorActive ? '1.5px solid #10B981' : '1px solid #3F3F46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '600',
            color: '#FFF',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {avatarUrl && isAmbassadorActive ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(profile?.name, profile?.email)
            )}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: '#FFFFFF', wordBreak: 'break-word' }}>
              {profile?.name || "User Profile"}
            </h3>
            
            <span style={{ 
              fontSize: '11px', 
              color: isAmbassadorActive ? '#10B981' : '#A1A1AA', 
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontWeight: '600',
              display: 'inline-block',
              marginTop: '3px'
            }}>
              {isAmbassadorActive ? '★ NOMAD AMBASSADOR' : 'CUSTOMER ACCOUNT'}
            </span>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#27272A', width: '100%' }} />

        {/* ডাইনামিক প্রকৃত তথ্য */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
              Full Name
            </span>
            <span style={{ fontSize: '14px', color: '#E4E4E7' }}>
              {profile?.name || 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
              Email Address
            </span>
            <span style={{ fontSize: '14px', color: '#E4E4E7', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {profile?.email || 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
              Phone Number
            </span>
            <span style={{ fontSize: '14px', color: profile?.phone ? '#E4E4E7' : '#52525B' }}>
              {profile?.phone || 'Not provided'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
              Active Profile Mode
            </span>
            <span style={{ fontSize: '14px', color: isAmbassadorActive ? '#10B981' : '#E4E4E7', fontWeight: '600' }}>
              {isAmbassadorActive ? 'Ambassador Partner Mode' : 'Customer Mode'}
            </span>
          </div>

          {memberSince && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                Member Since
              </span>
              <span style={{ fontSize: '14px', color: '#E4E4E7' }}>
                {memberSince}
              </span>
            </div>
          )}

          {/* ডাটাবেসে অ্যাম্বাসেডর রেকর্ড থাকলে তবেই এই সেকশন ডাটা দেখাবে */}
          {hasAmbassadorProfile && (
            <>
              <div style={{ height: '1px', backgroundColor: '#27272A', width: '100%', margin: '4px 0' }} />
              
              <span style={{ fontSize: '11px', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>
                Ambassador Information
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                  Display Name
                </span>
                <span style={{ fontSize: '14px', color: '#E4E4E7' }}>
                  {ambassadorData?.display_name || profile?.name || 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                  Store URL Slug
                </span>
                <span style={{ fontSize: '14px', color: '#E4E4E7', fontFamily: 'monospace' }}>
                  {ambassadorData?.assigned_slug ? `/${ambassadorData.assigned_slug}` : 'Not set'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                  Payout Details
                </span>
                <span style={{ fontSize: '14px', color: ambassadorData?.payout_details ? '#E4E4E7' : '#52525B' }}>
                  {ambassadorData?.payout_details || 'Not provided'}
                </span>
              </div>
            </>
          )}

        </div>

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
