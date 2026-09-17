import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AmbassadorJoin from './join/AmbassadorJoin';
import AmbassadorWorkspace from './AmbassadorWorkspace';

export default function AmbassadorPortal() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const cleanSlug = slug.trim().toLowerCase();
      const { data, error } = await supabase
        .from('ambassador')
        .select('*')
        .or(`token.ilike.${cleanSlug},assigned_slug.ilike.${cleanSlug}`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching ambassador data:', error);
      }

      setAmbassadorData(data);
      setLoading(false);
    }

    init();
  }, [slug]);

  if (loading) {
    return (
      <div style={statusContainerStyle}>
        <p style={{ letterSpacing: '3px', fontSize: '11px', color: '#888888' }}>VERIFYING ACCESS...</p>
      </div>
    );
  }

  if (!ambassadorData) {
    return (
      <div style={statusContainerStyle}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#ef4444', margin: 0 }}>INVITATION NOT FOUND</h2>
          <p style={{ color: '#888888', fontSize: '11px', marginTop: '12px', lineHeight: '1.6' }}>
            The invitation link or storefront you accessed is invalid or does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (!ambassadorData.is_registered) {
    const isExpired = ambassadorData.expires_at && new Date(ambassadorData.expires_at) < new Date();

    if (isExpired) {
      return (
        <div style={statusContainerStyle}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#ef4444', margin: 0 }}>INVITATION EXPIRED</h2>
            <p style={{ color: '#888888', fontSize: '11px', marginTop: '12px', lineHeight: '1.6' }}>
              This VIP invitation link has expired. Please request a new invitation link from the administrator.
            </p>
          </div>
        </div>
      );
    }

    return <AmbassadorJoin initialInviteData={ambassadorData} />;
  }

  const isOwner = currentUser?.id === ambassadorData.user_id;

  return (
    <AmbassadorWorkspace
      ambassadorData={ambassadorData}
      profile={currentUser}
      isOwner={isOwner}
      ambassadorState={{
        unpaidBalance: ambassadorData.unpaid_balance || 0,
        totalEarned: ambassadorData.total_earned || 0,
        slug: ambassadorData.assigned_slug
      }}
    />
  );
}

const statusContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#030303',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  fontFamily: 'monospace, sans-serif',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '380px',
  border: '1px solid #1a1a1a',
  backgroundColor: '#050505',
  padding: '32px 24px',
  textAlign: 'center',
};
