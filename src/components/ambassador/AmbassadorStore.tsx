import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AmbassadorJoin from './AmbassadorJoin';
import AmbassadorWorkspace from './AmbassadorWorkspace';

export default function AmbassadorStore() {
  // App.tsx এর /:slug রাউটের সাথে সামঞ্জস্য রেখে slug রিসিভ করা হচ্ছে
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

      // ১. বর্তমান লগইন ইউজার সেশন চেক
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // ২. স্ল্যাগ বা টোকেন দিয়ে ডাটাবেজে অমিল ছাড়া সার্চ করা
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

  // ৩. এখনো রেজিস্ট্রেশন/অনবোর্ডিং না করে থাকলে -> জয়েন পেজ
  if (!ambassadorData.is_registered) {
    return <AmbassadorJoin initialInviteData={ambassadorData} />;
  }

  // ৪. রেজিস্ট্রেশন সম্পূর্ণ থাকলে -> কাস্টমার স্টোরফ্রন্ট / ওনার ড্যাশবোর্ড
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
