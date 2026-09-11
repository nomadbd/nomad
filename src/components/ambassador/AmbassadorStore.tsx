import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AmbassadorJoin from './AmbassadorJoin';
import AmbassadorWorkspace from './AmbassadorWorkspace';

export default function AmbassadorStore() {
  const { token } = useParams<{ token: string }>(); // এখানে token মানেই ইউজারের দেওয়া নাম/স্ল্যাগ (যেমন: toha)
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

      // ২. নাম/টোকেন/স্ল্যাগ দিয়ে ডাটাবেজে সার্চ (সব ক্ষেত্রেই এটি মিলবে)
      const cleanToken = token.trim().toLowerCase();
      const { data } = await supabase
        .from('ambassador')
        .select('*')
        .or(`token.ilike.${cleanToken},assigned_slug.ilike.${cleanToken}`)
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

  // ৩. এখনো রেজিস্ট্রেশন না করে থাকলে -> অনবোর্ডিং পেজ
  if (!ambassadorData.is_registered) {
    return <AmbassadorJoin initialInviteData={ambassadorData} />;
  }

  // ৪. রেজিস্ট্রেশন সম্পূর্ণ থাকলে -> স্টোরফ্রন্ট / ড্যাশবোর্ড
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
