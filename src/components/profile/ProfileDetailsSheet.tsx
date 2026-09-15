import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface ProfileDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  ambassadorData?: any;
  avatarUrl: string | null;
  getInitials: (name?: string, email?: string) => string;
  portalMode?: 'customer' | 'ambassador';
  isAmbassador?: boolean;
}

export default function ProfileDetailsSheet({
  isOpen,
  onClose,
  profile,
  ambassadorData,
  avatarUrl,
  getInitials,
  portalMode = 'customer'
}: ProfileDetailsSheetProps) {
  const [customerStats, setCustomerStats] = useState({ totalOrders: 0, totalItems: 0, lastArea: 'N/A' });
  const [ambassadorStats, setAmbassadorStats] = useState({ totalSold: 0 });
  const [copyText, setCopyText] = useState('Copy Link');

  // ১. ব্যাকগ্রাউন্ড স্ক্রল লক
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchSummaryData();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, portalMode, profile?.id]);

  // ২. প্রয়োজনীয় ডাটা ফেচিং
  const fetchSummaryData = async () => {
    if (!profile?.id) return;

    if (portalMode === 'customer') {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, shipping_address, area, city, items')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (orders && orders.length > 0) {
          const totalOrders = orders.length;
          let totalItems = 0;

          orders.forEach((ord: any) => {
            if (Array.isArray(ord.items)) {
              totalItems += ord.items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0);
            } else if (ord.items) {
              totalItems += 1;
            }
          });

          const lastOrder = orders[0];
          let areaStr = 'N/A';
          if (lastOrder?.area) areaStr = lastOrder.area;
          else if (lastOrder?.city) areaStr = lastOrder.city;
          else if (typeof lastOrder?.shipping_address === 'object') {
            areaStr = lastOrder.shipping_address?.area || lastOrder.shipping_address?.city || 'N/A';
          }

          setCustomerStats({
            totalOrders,
            totalItems: totalItems || totalOrders,
            lastArea: areaStr
          });
        }
      } catch (err) {
        console.error('Error fetching customer stats:', err);
      }
    } else if (portalMode === 'ambassador') {
      try {
        const ambId = ambassadorData?.id || profile?.id;
        const { data: ambOrders } = await supabase
          .from('orders')
          .select('id, items')
          .or(`ambassador_id.eq.${ambId},referred_by.eq.${ambId}`);

        if (ambOrders) {
          let totalSold = 0;
          ambOrders.forEach((ord: any) => {
            if (Array.isArray(ord.items)) {
              totalSold += ord.items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0);
            } else {
              totalSold += 1;
            }
          });
          setAmbassadorStats({ totalSold });
        }
      } catch (err) {
        console.error('Error fetching ambassador stats:', err);
      }
    }
  };

  const handleCopyLink = () => {
    if (!ambassadorData?.assigned_slug) return;
    const storeLink = `${window.location.origin}/${ambassadorData.assigned_slug}`;
    navigator.clipboard.writeText(storeLink);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy Link'), 2000);
  };

  if (!isOpen) return null;

  const isAmbassadorMode = portalMode === 'ambassador';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A';

  const ambassadorSince = ambassadorData?.created_at
    ? new Date(ambassadorData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : memberSince;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        touchAction: 'none'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0F0F0F',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          border: '1px solid #222222',
          borderBottom: 'none',
          padding: '20px 24px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '85vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          boxSizing: 'border-box'
        }}
      >
        {/* ড্র্যাগ ইন্ডিকেটর বার */}
        <div style={{
          width: '32px',
          height: '4px',
          backgroundColor: '#27272A',
          borderRadius: '2px',
          margin: '0 auto'
        }} />

        {/* হেডার (অ্যাভাটার ও নাম) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: '600',
            color: '#EEEEEE',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(isAmbassadorMode ? (ambassadorData?.display_name || profile?.name) : profile?.name, profile?.email)
            )}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#FFFFFF', wordBreak: 'break-word' }}>
              {isAmbassadorMode ? (ambassadorData?.display_name || profile?.name) : (profile?.name || "User Profile")}
            </h3>
            <span style={{ fontSize: '12px', color: '#71717A', display: 'block', marginTop: '2px' }}>
              {isAmbassadorMode ? 'Ambassador Partner' : 'Customer Account'}
            </span>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#18181B', width: '100%' }} />

        {/* তথ্যসমূহ - মিনিমাল লেআউট */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isAmbassadorMode ? (
            <>
              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email Address
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#DDDDDD', fontFamily: 'monospace' }}>
                  {profile?.email || 'N/A'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ambassador Since
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#DDDDDD' }}>
                  {ambassadorSince}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Products Sold
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#DDDDDD', fontWeight: '500' }}>
                  {ambassadorStats.totalSold} {ambassadorStats.totalSold === 1 ? 'item' : 'items'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Store URL
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#CCCCCC', fontFamily: 'monospace' }}>
                    {ambassadorData?.assigned_slug ? `/${ambassadorData.assigned_slug}` : 'Not set'}
                  </span>
                  {ambassadorData?.assigned_slug && (
                    <button
                      onClick={handleCopyLink}
                      style={{
                        background: 'transparent',
                        border: '1px solid #27272A',
                        borderRadius: '6px',
                        color: copyText === 'Copied!' ? '#FFFFFF' : '#A1A1AA',
                        fontSize: '11px',
                        padding: '4px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      {copyText}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email Address
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#DDDDDD', fontFamily: 'monospace' }}>
                  {profile?.email || 'N/A'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Member Since
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#DDDDDD' }}>
                  {memberSince}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Purchases
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#DDDDDD' }}>
                  {customerStats.totalOrders} {customerStats.totalOrders === 1 ? 'order' : 'orders'} ({customerStats.totalItems} {customerStats.totalItems === 1 ? 'product' : 'products'})
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Last Delivery Area
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#DDDDDD' }}>
                  {customerStats.lastArea}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ক্লোজ বাটন */}
        <button
          onClick={onClose}
          style={{
            marginTop: '6px',
            width: '100%',
            padding: '11px',
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            borderRadius: '10px',
            color: '#EEEEEE',
            fontWeight: '500',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
