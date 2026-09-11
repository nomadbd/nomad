import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AmbassadorJoin from './AmbassadorJoin';
import AmbassadorWorkspace from './AmbassadorWorkspace';

export default function AmbassadorStore() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      if (!token) {
        setLoading(false);
        return;
      }

      // ১. বর্তমান লগইন ইউজার চেক
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // ২. ইনভাইটেশন বা অ্যাম্বাসেডর ডাটা চেক (টোকেন বা স্ল্যাগ দুটো দিয়েই মিল পাওয়া যাবে)
      const { data } = await supabase
        .from('ambassador')
        .select('*')
        .or(`token.eq.${token},assigned_slug.eq.${token}`)
        .maybeSingle();

      setAmbassadorData(data);
      setLoading(false);
    }

    init();
  }, [token]);

  if (loading) {
    return (
      <div style={statusContainerStyle}>
        <p style={{ letterSpacing: '3px', fontSize: '11px', color: '#888888' }}>VERIFYING ACCESS...</p>
      </div>
    );
  }

  // ডাটা না পাওয়া গেলে
  if (!ambassadorData) {
    return (
      <div style={statusContainerStyle}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#ef4444', margin: 0 }}>INVITATION NOT FOUND</h2>
          <p style={{ color: '#888888', fontSize: '11px', marginTop: '12px', lineHeight: '1.6' }}>
            The invitation link or storefront you accessed is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  // ৩. ইউজার রেজিস্টার্ড না হলে -> Prop হিসেবে ডাটা পাঠাবে (ডাবল ফেচ বন্ধ)
  if (!ambassadorData.is_registered) {
    return <AmbassadorJoin initialInviteData={ambassadorData} />;
  }

  // ৪. ইউজার রেজিস্টার্ড থাকলে
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
