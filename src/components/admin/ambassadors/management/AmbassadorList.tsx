import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import AmbassadorSkeleton from './AmbassadorSkeleton';
import ProductManager from './ProductManager';
import PayoutManager from '@/components/admin/ambassadors/payouts/PayoutManager';

interface AmbassadorProfile {
  id: string; // Profiles ID
  ambassador_id: string; // Ambassador table ID
  name: string;
  email: string;
  status: string;
  assigned_slug: string;
  created_at?: string;
  total_sales?: number;
  assigned_products_count?: number;
  products_sold_count?: number;
}

interface AmbassadorListProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
}

export default function AmbassadorList({
  searchQuery = '',
  isFilterOpen = true,
}: AmbassadorListProps) {
  const [activeSubTab, setActiveSubTab] = useState<'AMBASSADORS' | 'PAYOUTS'>('AMBASSADORS');
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [pendingPayoutCount, setPendingPayoutCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Filter States
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [salesFilter, setSalesFilter] = useState<'ALL' | 'HIGHEST' | 'LOWEST' | 'NO_SALES'>('ALL');

  // Product Manager Modal State
  const [selectedAmbassador, setSelectedAmbassador] = useState<AmbassadorProfile | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchAmbassadorsAndStats = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch Ambassadors with product details
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
              sales_count
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
          
          const assignedCount = productsList.length;
          const soldCount = productsList.reduce((acc: number, curr: any) => acc + (curr.sales_count || 0), 0);

          return {
            id: item.id,
            ambassador_id: ambData?.id || item.id,
            name: item.name || 'Unnamed Ambassador',
            email: item.email || 'No Email',
            status: item.status || 'ACTIVE',
            assigned_slug: ambData?.assigned_slug || '',
            created_at: item.created_at || '',
            total_sales: ambData?.total_sales || 0,
            assigned_products_count: assignedCount,
            products_sold_count: soldCount,
          };
        });
        setAmbassadors(formattedData);
      }

      // 2. Fetch Pending Payout Requests Count
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

  const handleCopyLink = (fullUrl: string, slug: string) => {
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
    } catch (err: any) {
      alert(`Failed to ${actionText} ambassador: ` + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter Logic
  const filteredAmbassadors = ambassadors
    .filter((amb) => {
      if (statusFilter === 'ACTIVE' && amb.status?.toUpperCase() !== 'ACTIVE') return false;
      if (statusFilter === 'BLOCKED' && amb.status?.toUpperCase() !== 'BLOCKED' && amb.status?.toUpperCase() !== 'DEACTIVATED') return false;
      if (salesFilter === 'NO_SALES' && (amb.total_sales || 0) > 0) return false;

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
      if (salesFilter === 'HIGHEST') return (b.total_sales || 0) - (a.total_sales || 0);
      if (salesFilter === 'LOWEST') return (a.total_sales || 0) - (b.total_sales || 0);

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
            <div className="animate-fade-in" style={{ marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', padding: '14px 16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>SORT BY JOIN DATE</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['NEWEST', 'OLDEST'].map((opt) => (
                      <button key={opt} type="button" onClick={() => setSortOrder(opt as any)} style={{ backgroundColor: 'transparent', color: sortOrder === opt ? '#2997ff' : '#666', border: 'none', fontSize: '10px', fontFamily: 'monospace', cursor: 'pointer', fontWeight: sortOrder === opt ? 'bold' : 'normal' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AMBASSADOR LIST */}
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
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* TOP HEADER: NAME + INTERACTIVE STATUS BADGE */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.2px' }}>
                          {amb.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px', fontFamily: 'monospace' }}>
                          {amb.email}
                        </div>
                      </div>

                      {/* STATUS PILL BADGE */}
                      <button
                        type="button"
                        disabled={actionLoading === amb.id}
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
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isBlocked ? '#ef4444' : '#22c55e' }} />
                        {actionLoading === amb.id ? 'UPDATING...' : isBlocked ? 'DEACTIVATED' : 'ACTIVE'}
                      </button>
                    </div>

                    {/* INTERACTIVE METRIC CARDS (GRID OF 3) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                      {/* CARD 1: TOTAL SALES */}
                      <div
                        style={{
                          backgroundColor: '#121215',
                          border: '1px solid #27272a',
                          padding: '10px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                          TOTAL SALES
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#64ffda', marginTop: '4px', fontFamily: 'monospace' }}>
                          ৳{(amb.total_sales || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* CARD 2: ASSIGNED PRODUCTS (ACTIONABLE - CLICK OPENS MODAL) */}
                      <div
                        onClick={() => setSelectedAmbassador(amb)}
                        style={{
                          backgroundColor: '#121215',
                          border: '1px solid #2997ff40',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '8px', color: '#2997ff', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            ASSIGNED PRODUCTS
                          </div>
                          <span style={{ fontSize: '10px', color: '#2997ff' }}>⚙</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px', fontFamily: 'monospace' }}>
                          {amb.assigned_products_count || 0} <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 'normal' }}>items</span>
                        </div>
                      </div>

                      {/* CARD 3: PRODUCTS SOLD */}
                      <div
                        style={{
                          backgroundColor: '#121215',
                          border: '1px solid #27272a',
                          padding: '10px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                          UNITS SOLD
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px', fontFamily: 'monospace' }}>
                          {amb.products_sold_count || 0}
                        </div>
                      </div>
                    </div>

                    {/* SMART URL & COPY ACTION BAR */}
                    {amb.assigned_slug && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000000', border: '1px solid #1a1a1e', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                          {shortDisplayLink}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(fullLink, amb.assigned_slug)}
                            style={{ backgroundColor: 'transparent', color: copiedSlug === amb.assigned_slug ? '#64ffda' : '#a1a1aa', border: 'none', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                          >
                            {copiedSlug === amb.assigned_slug ? 'COPIED!' : '📋 COPY'}
                          </button>
                          <a
                            href={fullLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2997ff', textDecoration: 'none' }}
                          >
                            ↗ OPEN
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

      {/* PRODUCT MANAGER MODAL */}
      {selectedAmbassador && (
        <ProductManager
          ambassadorId={selectedAmbassador.ambassador_id}
          ambassadorName={selectedAmbassador.name}
          ambassadorSlug={selectedAmbassador.assigned_slug}
          onClose={() => {
            setSelectedAmbassador(null);
            fetchAmbassadorsAndStats(); // Refresh product counts after closing modal
          }}
        />
      )}
    </div>
  );
}
