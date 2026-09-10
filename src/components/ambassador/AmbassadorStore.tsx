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

      // ২. ইনভাইটেশন বা অ্যাম্বাসেডর ডাটা চেক
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
          <p style={{ color: '#888888', fontSize: '11px', marginTop: '12px' }}>
            The link you accessed is invalid or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // ১. ইউজার রেজিস্টার্ড না হলে -> রেজিস্ট্রেশন ফর্মে পাঠাবে
  if (!ambassadorData.is_registered) {
    return <AmbassadorJoin />;
  }

  // ২. ইউজার রেজিস্টার্ড এবং লগইন করা থাকলে -> ড্যাশবোর্ড দেখাবে
  return (
    <AmbassadorWorkspace
      ambassadorData={ambassadorData}
      profile={currentUser}
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
