import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // অথবা আপনার ব্যবহৃত রাউটার
import { supabase } from '@/supabaseClient';
import AmbassadorSkeleton from './AmbassadorSkeleton';
import ProductManager from './ProductManager';
import PayoutManager from '@/components/admin/ambassadors/payouts/PayoutManager';

// Valid Icon Imports
import {
  CheckIcon,
  CloseIcon,
  EmailIcon,
  MessageIcon,
  CartIcon,
  HistoryIcon,
  SettingsIcon,
} from '@/components/icons';

interface AmbassadorProfile {
  id: string; // Profiles ID
  ambassador_id: string;
  name: string;
  email: string;
  status: string;
  assigned_slug: string;
  created_at?: string;
  total_sales?: number;
  assigned_products_count?: number;
}

interface AmbassadorListProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  onOpenChat?: (ambassadorId: string, ambassadorEmail: string) => void; // মেসেজ অপেন করার জন্য কলব্যাক
}

export default function AmbassadorList({
  searchQuery = '',
  isFilterOpen = true,
  onOpenChat,
}: AmbassadorListProps) {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<'AMBASSADORS' | 'PAYOUTS'>('AMBASSADORS');
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [pendingPayoutCount, setPendingPayoutCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Bottom Sheet & Modal States
  const [bottomSheetAmbassador, setBottomSheetAmbassador] = useState<AmbassadorProfile | null>(null);
  const [selectedAmbassadorForProducts, setSelectedAmbassadorForProducts] = useState<AmbassadorProfile | null>(null);

  // Filter States
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchAmbassadorsAndStats = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          status,
          created_at,
          ambassador (
            id,
            assigned_slug,
            total_sales,
            ambassador_products (
              id,
              is_visible
            )
          )
        `)
        .ilike('role', 'ambassador')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: AmbassadorProfile[] = data.map((item: any) => {
          const ambData = Array.isArray(item.ambassador) ? item.ambassador[0] : item.ambassador;
          const productsList = ambData?.ambassador_products || [];

          return {
            id: item.id,
            ambassador_id: ambData?.id || item.id,
            name: item.name || 'Unnamed Ambassador',
            email: item.email || 'No Email',
            status: item.status || 'ACTIVE',
            assigned_slug: ambData?.assigned_slug || '',
            created_at: item.created_at || '',
            total_sales: ambData?.total_sales || 0,
            assigned_products_count: productsList.length,
          };
        });
        setAmbassadors(formattedData);
      }

      const { count } = await supabase
        .from('payout_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      setPendingPayoutCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching data:', err.message);
      setErrorMessage(err.message || 'Failed to fetch ambassadors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadorsAndStats();
  }, []);

  // চ্যাট অপেন করার হ্যান্ডলার
  const handleSendMessage = (ambassador: AmbassadorProfile) => {
    setBottomSheetAmbassador(null);
    if (onOpenChat) {
      onOpenChat(ambassador.id, ambassador.email);
    } else {
      // যদি অন-ওপেন-চ্যাট প্রপ না থাকে তবে সরাসরি মেসেজ পেজে নেভিগেট করবে
      router.push(`/admin/messages?userId=${ambassador.id}`);
    }
  };

  // ইমেইল অ্যাপ খোলার নিরাপদ হ্যান্ডলার
  const handleOpenEmail = (email: string) => {
    if (!email || email === 'No Email') {
      alert('Email not available');
      return;
    }
    // সরাসরি ইমেইল ক্লায়েন্ট খোলার চেষ্টা
    window.location.href = `mailto:${email}`;
  };

  const handleCopyLink = (e: React.MouseEvent, fullUrl: string, slug: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggleStatus = async (amb: AmbassadorProfile) => {
    const isBlocked = amb.status?.toUpperCase() === 'BLOCKED' || amb.status?.toUpperCase() === 'DEACTIVATED';
    const actionText = isBlocked ? 'activate' : 'deactivate';

    const confirm = window.confirm(`Are you sure you want to ${actionText} ${amb.name}?`);
    if (!confirm) return;

    setActionLoading(amb.id);
    try {
      const rpcName = isBlocked ? 'activate_ambassador' : 'deactivate_ambassador';
      const { error } = await supabase.rpc(rpcName, { target_user_id: amb.id });
      if (error) throw error;
      fetchAmbassadorsAndStats();
      if (bottomSheetAmbassador) {
        setBottomSheetAmbassador((prev) =>
          prev ? { ...prev, status: isBlocked ? 'ACTIVE' : 'DEACTIVATED' } : null
        );
      }
    } catch (err: any) {
      alert(`Failed to ${actionText} ambassador: ` + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAmbassadors = ambassadors
    .filter((amb) => {
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = amb.name?.toLowerCase().includes(query);
        const matchesEmail = amb.email?.toLowerCase().includes(query);
        const matchesSlug = amb.assigned_slug?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesSlug) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'OLDEST' ? dateA - dateB : dateB - dateA;
    });

  return (
    <div style={{ width: '100%', color: '#ffffff', fontFamily: 'sans-serif' }}>
      {/* SUB-TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #1a1a1a', marginBottom: '16px', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('AMBASSADORS')}
          style={{
            backgroundColor: 'transparent',
            color: activeSubTab === 'AMBASSADORS' ? '#ffffff' : '#666',
            border: 'none',
            borderBottom: activeSubTab === 'AMBASSADORS' ? '2px solid #2997ff' : '2px solid transparent',
            padding: '6px 0',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
          }}
        >
          AMBASSADORS ({ambassadors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('PAYOUTS')}
          style={{
            backgroundColor: 'transparent',
            color: activeSubTab === 'PAYOUTS' ? '#ffffff' : '#666',
            border: 'none',
            borderBottom: activeSubTab === 'PAYOUTS' ? '2px solid #2997ff' : '2px solid transparent',
            padding: '6px 0',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          PAYOUT REQUESTS
          {pendingPayoutCount > 0 && (
            <span style={{ backgroundColor: '#e3a008', color: '#000', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px' }}>
              {pendingPayoutCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'PAYOUTS' ? (
        <PayoutManager isFilterOpen={isFilterOpen} />
      ) : (
        <>
          {/* FILTER PANEL */}
          {isFilterOpen && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', padding: '12px 14px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '1px' }}>SORT BY:</span>
                {['NEWEST', 'OLDEST'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSortOrder(opt as any)}
                    style={{
                      backgroundColor: 'transparent',
                      color: sortOrder === opt ? '#2997ff' : '#71717a',
                      border: 'none',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      fontWeight: sortOrder === opt ? 'bold' : 'normal',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AMBASSADOR CARDS LIST */}
          {loading ? (
            <AmbassadorSkeleton />
          ) : errorMessage ? (
            <div style={{ backgroundColor: '#110505', border: '1px solid #441111', color: '#ff6b6b', padding: '12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
              ERROR: {errorMessage}
            </div>
          ) : filteredAmbassadors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '8px' }}>
              NO AMBASSADORS FOUND MATCHING CRITERIA.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAmbassadors.map((amb) => {
                const isBlocked = amb.status?.toUpperCase() === 'BLOCKED' || amb.status?.toUpperCase() === 'DEACTIVATED';
                const fullLink = amb.assigned_slug ? `${baseUrl}/${amb.assigned_slug}` : '';
                const shortDisplayLink = amb.assigned_slug ? `${baseUrl.replace(/^https?:\/\//, '')}/${amb.assigned_slug}` : 'N/A';

                return (
                  <div
                    key={amb.id}
                    style={{
                      backgroundColor: '#09090b',
                      border: '1px solid #1f1f23',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {/* TOP HEADER */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div
                        onClick={() => setBottomSheetAmbassador(amb)}
                        style={{ cursor: 'pointer', flex: 1 }}
                      >
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="hover:underline">{amb.name}</span>
                          <SettingsIcon style={{ width: '12px', height: '12px', color: '#71717a' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px', fontFamily: 'monospace' }}>
                          {amb.email}
                        </div>
                      </div>

                      <div
                        onClick={() => handleToggleStatus(amb)}
                        style={{
                          backgroundColor: isBlocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                          color: isBlocked ? '#ef4444' : '#22c55e',
                          fontSize: '10px',
                          fontWeight: '600',
                          fontFamily: 'monospace',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          userSelect: 'none',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isBlocked ? '#ef4444' : '#22c55e' }} />
                        {actionLoading === amb.id ? 'UPDATING...' : isBlocked ? 'DEACTIVATED' : 'ACTIVE'}
                      </div>
                    </div>

                    {/* METRIC CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      <div style={{ backgroundColor: '#121215', border: '1px solid #1f1f23', padding: '10px 12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                          TOTAL SALES
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#64ffda', marginTop: '4px', fontFamily: 'monospace' }}>
                          ৳{(amb.total_sales || 0).toLocaleString()}
                        </div>
                      </div>

                      <div
                        onClick={() => setSelectedAmbassadorForProducts(amb)}
                        style={{
                          backgroundColor: '#121215',
                          border: '1px solid rgba(41, 151, 255, 0.3)',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '8px', color: '#2997ff', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            ASSIGNED PRODUCTS
                          </div>
                          <SettingsIcon style={{ width: '10px', height: '10px', color: '#2997ff' }} />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px', fontFamily: 'monospace' }}>
                          {amb.assigned_products_count || 0} <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 'normal' }}>items</span>
                        </div>
                      </div>
                    </div>

                    {/* SMART URL BOX */}
                    {amb.assigned_slug && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000000', border: '1px solid #1a1a1e', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                          {shortDisplayLink}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e, fullLink, amb.assigned_slug)}
                            style={{ backgroundColor: 'transparent', color: copiedSlug === amb.assigned_slug ? '#64ffda' : '#a1a1aa', border: 'none', cursor: 'pointer', fontSize: '10px', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {copiedSlug === amb.assigned_slug ? (
                              <>
                                <CheckIcon style={{ width: '12px', height: '12px' }} /> COPIED!
                              </>
                            ) : (
                              '📋 COPY'
                            )}
                          </button>
                          <a
                            href={fullLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2997ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                          >
                            OPEN ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================== */}
      {/* ACTION CENTER - BOTTOM SHEET MODAL */}
      {/* ========================================== */}
      {bottomSheetAmbassador && (
        <div
          onClick={() => setBottomSheetAmbassador(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#09090b',
              borderTop: '1px solid #1f1f23',
              borderRadius: '16px 16px 0 0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* SHEET HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                  {bottomSheetAmbassador.name}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', marginTop: '2px' }}>
                  {bottomSheetAmbassador.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBottomSheetAmbassador(null)}
                style={{ backgroundColor: '#121215', border: '1px solid #27272a', color: '#a1a1aa', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CloseIcon style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {/* QUICK COMMUNICATION ACTION BAR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* DIRECT IN-APP MESSAGE BUTTON */}
              <button
                type="button"
                onClick={() => handleSendMessage(bottomSheetAmbassador)}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <MessageIcon style={{ width: '14px', height: '14px', color: '#2997ff' }} />
                Send Message
              </button>

              {/* DIRECT EMAIL BUTTON */}
              <button
                type="button"
                onClick={() => handleOpenEmail(bottomSheetAmbassador.email)}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <EmailIcon style={{ width: '14px', height: '14px', color: '#64ffda' }} />
                Email Profile
              </button>
            </div>

            {/* ACTION LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const amb = bottomSheetAmbassador;
                  setBottomSheetAmbassador(null);
                  setSelectedAmbassadorForProducts(amb);
                }}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #1f1f23',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CartIcon style={{ width: '16px', height: '16px', color: '#2997ff' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>Manage Products</div>
                    <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                      {bottomSheetAmbassador.assigned_products_count || 0} products currently assigned
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#71717a' }}>→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBottomSheetAmbassador(null);
                  setActiveSubTab('PAYOUTS');
                }}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #1f1f23',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <HistoryIcon style={{ width: '16px', height: '16px', color: '#e3a008' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>Payout Requests & History</div>
                    <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                      View all payouts for this ambassador
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#71717a' }}>→</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleStatus(bottomSheetAmbassador)}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #1f1f23',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: bottomSheetAmbassador.status?.toUpperCase() === 'BLOCKED' ? '#22c55e' : '#ef4444',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: '600' }}>
                  {bottomSheetAmbassador.status?.toUpperCase() === 'BLOCKED' ? 'Activate Ambassador Account' : 'Deactivate Ambassador Account'}
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>●</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MANAGER MODAL */}
      {selectedAmbassadorForProducts && (
        <ProductManager
          ambassadorId={selectedAmbassadorForProducts.ambassador_id}
          ambassadorName={selectedAmbassadorForProducts.name}
          ambassadorSlug={selectedAmbassadorForProducts.assigned_slug}
          onClose={() => {
            setSelectedAmbassadorForProducts(null);
            fetchAmbassadorsAndStats();
          }}
        />
      )}
    </div>
  );
}
