import React from 'react';
import AnalyticsChart from './AnalyticsChart';
import StoreLinkBanner from './StoreLinkBanner';

interface AmbassadorWorkspaceProps {
  ambassadorData: any;
  profile: any;
  ambassadorState: any;
  isOwner?: boolean;
}

export default function AmbassadorWorkspace({
  ambassadorData,
  profile,
  ambassadorState,
  isOwner = true
}: AmbassadorWorkspaceProps) {
  const name = ambassadorData?.display_name || profile?.user_metadata?.full_name || 'AMBASSADOR';
  const commissionRate = ambassadorData?.commission_rate || 0;

  // ১. সাধারণ ভিজিটর/কাস্টমারদের জন্য পাবলিক স্টোরফ্রন্ট ভিউ (যখন লিংকে অন্য কেউ ঢুকবে)
  if (!isOwner) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: '#ffffff', fontFamily: 'monospace, sans-serif' }}>
        <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '24px', marginBottom: '32px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '3px', textTransform: 'uppercase' }}>
            CURATED BY AMBASSADOR
          </span>
          <h1 style={{ fontSize: '24px', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {name}'S NOMAD COLLECTION
          </h1>
          <p style={{ fontSize: '11px', color: '#aaaaaa', marginTop: '8px', letterSpacing: '0.5px' }}>
            Handpicked essentials curated exclusively for you.
          </p>
        </header>

        {/* সাধারণ প্রোডাক্ট লিস্টের সেকশন */}
        <div style={{ padding: '40px 0', textAlign: 'center', border: '1px dashed #222222', backgroundColor: '#050505' }}>
          <p style={{ color: '#888888', fontSize: '12px', letterSpacing: '1px' }}>
            [ PUBLIC STOREFRONT / PRODUCT CATALOG HERE ]
          </p>
          <span style={{ fontSize: '10px', color: '#555555' }}>
            এখানে আপনার সাধারণ প্রোডাক্ট লিস্ট কম্পোনেন্টটি প্লেস করে দিলে কাস্টমার কেনাকাটা করতে পারবে।
          </span>
        </div>
      </div>
    );
  }

  // ২. অ্যাম্বাসেডর নিজের ড্যাশবোর্ড (ব্যালেন্স, অ্যানালিটিক্স, প্রাইভেট ভিউ)
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', color: '#ffffff', fontFamily: 'monospace, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '10px', color: '#888888', letterSpacing: '2px', textTransform: 'uppercase' }}>NOMAD PORTAL</span>
          <h1 style={{ fontSize: '20px', margin: '4px 0 0 0', letterSpacing: '1px', textTransform: 'uppercase' }}>
            WELCOME, {name}
          </h1>
        </div>
        <div style={{ border: '1px solid #333333', padding: '6px 12px', fontSize: '11px', letterSpacing: '1px' }}>
          COMMISSION: <b style={{ color: '#ffffff' }}>{commissionRate}%</b>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ color: '#888888', fontSize: '10px', letterSpacing: '1px' }}>UNPAID BALANCE</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
            ৳{ambassadorState?.unpaidBalance || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ color: '#888888', fontSize: '10px', letterSpacing: '1px' }}>TOTAL EARNED</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
            ৳{ambassadorState?.totalEarned || 0}
          </div>
        </div>
      </div>

      <StoreLinkBanner slug={ambassadorState?.slug || ambassadorData?.assigned_slug} />
      <div style={{ marginTop: '32px' }}>
        <AnalyticsChart totalEarned={ambassadorState?.totalEarned} />
      </div>
    </div>
  );
}
