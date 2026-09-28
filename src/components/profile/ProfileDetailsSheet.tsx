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

  // ১. ব্যাকগ্রাউন্ড স্ক্রল লক ও ডাটা কল
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
  }, [isOpen, portalMode, profile?.id, profile?.email]);

  // ২. ডাটা ফেচিং (orders + order_items)
  const fetchSummaryData = async () => {
    if (!profile?.id && !profile?.email) return;

    if (portalMode === 'customer') {
      try {
        // user_id অথবা customer_email দুইভাবেই ফিল্টার করা
        let userFilter = `user_id.eq.${profile.id}`;
        if (profile?.email) {
          userFilter += `,customer_email.eq.${profile.email}`;
        }

        // orders এবং রিলেটেড order_items ডাটা একসাথে ফেচ করা
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            shipping_address,
            created_at,
            order_items (
              quantity
            )
          `)
          .or(userFilter)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (orders && orders.length > 0) {
          const totalOrders = orders.length; // মোট অর্ডারের সংখ্যা (পেন্ডিং + অন্যান্য)
          let deliveredItemsCount = 0;

          orders.forEach((ord: any) => {
            const statusLower = ord.status?.toLowerCase() || '';
            
            // শুধুমাত্র সফলভাবে ডেলিভারি হওয়া প্রোডাক্ট গণনা (delivered বা completed)
            if (statusLower === 'delivered' || statusLower === 'completed') {
              if (Array.isArray(ord.order_items)) {
                deliveredItemsCount += ord.order_items.reduce(
                  (acc: number, item: any) => acc + (Number(item.quantity) || 1),
                  0
                );
              }
            }
          });

          // লাস্ট ডেলিভারি এরিয়া বের করা
          const lastOrder = orders[0];
          let areaStr = 'N/A';
          if (lastOrder?.shipping_address) {
            if (typeof lastOrder.shipping_address === 'object') {
              areaStr =
                lastOrder.shipping_address?.area ||
                lastOrder.shipping_address?.city ||
                lastOrder.shipping_address?.address ||
                'N/A';
            } else if (typeof lastOrder.shipping_address === 'string') {
              areaStr = lastOrder.shipping_address;
            }
          }

          setCustomerStats({
            totalOrders,
            totalItems: deliveredItemsCount,
            lastArea: areaStr
          });
        } else {
          setCustomerStats({ totalOrders: 0, totalItems: 0, lastArea: 'N/A' });
        }
      } catch (err) {
        console.error('Error fetching customer stats:', err);
      }
    } else if (portalMode === 'ambassador') {
      try {
        const ambId = ambassadorData?.id || profile?.id;
        
        const { data: ambOrders, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            order_items (
              quantity
            )
          `)
          .eq('ambassador_id', ambId);

        if (error) throw error;

        if (ambOrders) {
          let totalSold = 0;
          ambOrders.forEach((ord: any) => {
            if (Array.isArray(ord.order_items)) {
              totalSold += ord.order_items.reduce(
                (acc: number, item: any) => acc + (Number(item.quantity) || 1),
                0
              );
            }
          });
          setAmbassadorStats({ totalSold });
        }
      } catch (err) {
        console.error('Error fetching ambassador stats:', err);
      }
    }
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
        {/* ড্র্যাগ বার */}
        <div style={{
          width: '32px',
          height: '4px',
          backgroundColor: '#27272A',
          borderRadius: '2px',
          margin: '0 auto'
        }} />

        {/* হেডার (উভয় মোডেই মূল প্রোফাইল নাম দেখাবে) */}
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
            {isAmbassadorMode && avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(profile?.name, profile?.email)
            )}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#FFFFFF', wordBreak: 'break-word' }}>
              {profile?.name || "User Profile"}
            </h3>
            <span style={{ fontSize: '12px', color: '#71717A', display: 'block', marginTop: '2px' }}>
              {isAmbassadorMode ? 'Ambassador Partner' : 'Customer Account'}
            </span>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#18181B', width: '100%' }} />

        {/* তথ্যসমূহ */}
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
