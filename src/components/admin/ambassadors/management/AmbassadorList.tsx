import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import AmbassadorSkeleton from './AmbassadorSkeleton';
import ProductManager from './ProductManager';
import PayoutList from '../payouts/PayoutList';

interface AmbassadorProfile {
  id: string; // Profiles ID
  ambassador_id: string; // Ambassador table ID
  name: string;
  email: string;
  status: string;
  assigned_slug: string;
  created_at?: string;
  total_sales?: number;
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
      // 1. Fetch Ambassadors
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
            total_sales
          )
        `)
        .ilike('role', 'ambassador')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: AmbassadorProfile[] = data.map((item: any) => {
          const ambData = Array.isArray(item.ambassador) ? item.ambassador[0] : item.ambassador;
          return {
            id: item.id,
            ambassador_id: ambData?.id || item.id,
            name: item.name || 'Unnamed Ambassador',
            email: item.email || 'No Email',
            status: item.status || 'ACTIVE',
            assigned_slug: ambData?.assigned_slug || '',
            created_at: item.created_at || '',
            total_sales: ambData?.total_sales || 0,
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

  const handleOpenMessages = (e: React.MouseEvent, searchTarget: string) => {
    e.preventDefault();
    const targetUrl = `/admin?tab=messages&search=${encodeURIComponent(searchTarget)}&from=ambassadors`;
    window.history.pushState({}, '', targetUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleBlockAmbassador = async (userId: string, currentSlug: string) => {
    const confirmBlock = window.confirm(
      `Are you sure you want to deactivate this ambassador?\nStore link (${currentSlug}) will be deactivated.`
    );
    if (!confirmBlock) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('deactivate_ambassador', { target_user_id: userId });
      if (error) throw error;
      fetchAmbassadorsAndStats();
    } catch (err: any) {
      alert('Failed to deactivate ambassador: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateAmbassador = async (userId: string) => {
    const confirmActivate = window.confirm('Are you sure you want to activate this ambassador?');
    if (!confirmActivate) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('activate_ambassador', { target_user_id: userId });
      if (error) throw error;
      fetchAmbassadorsAndStats();
    } catch (err: any) {
      alert('Failed to activate ambassador: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter & Sort Logic
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
      if (salesFilter === 'HIGHEST') {
        return (b.total_sales || 0) - (a.total_sales || 0);
      }
      if (salesFilter === 'LOWEST') {
        return (a.total_sales || 0) - (b.total_sales || 0);
      }

      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      if (sortOrder === 'OLDEST') return dateA - dateB;
      return dateB - dateA;
    });

  const dateSortOptions = ['NEWEST', 'OLDEST'];
  const statusOptions = ['ALL', 'ACTIVE', 'BLOCKED'];
  const salesOptions = [
    { label: 'ALL', value: 'ALL' },
    { label: 'HIGHEST SALES', value: 'HIGHEST' },
    { label: 'LOWEST SALES', value: 'LOWEST' },
    { label: 'NO SALES (0)', value: 'NO_SALES' },
  ];

  return (
    <div style={{ width: '100%', color: '#ffffff', fontFamily: 'sans-serif' }}>
      {/* MINIMAL SUB-TAB NAVIGATION */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          borderBottom: '1px solid #1a1a1a',
          marginBottom: '16px',
          paddingBottom: '2px',
        }}
      >
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
            transition: 'all 0.2s ease',
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
            transition: 'all 0.2s ease',
          }}
        >
          PAYOUT REQUESTS
          {pendingPayoutCount > 0 && (
            <span
              style={{
                backgroundColor: '#e3a008',
                color: '#000',
                fontSize: '9px',
                fontWeight: 'bold',
                padding: '1px 5px',
                borderRadius: '10px',
              }}
            >
              {pendingPayoutCount}
            </span>
          )}
        </button>
      </div>

      {/* RENDER PAYOUTS VIEW */}
      {activeSubTab === 'PAYOUTS' ? (
        <PayoutList />
      ) : (
        <>
          {/* FILTER SECTION */}
          {isFilterOpen && (
            <div className="filter-expand-content animate-fade-in" style={{ marginBottom: '16px' }}>
              <div
                style={{
                  backgroundColor: '#050505',
                  border: '1px solid #222',
                  padding: '16px',
                  borderRadius: '2px',
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* SORT BY JOIN DATE */}
                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    SORT BY JOIN DATE
                  </label>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', width: '100%' }}>
                    {dateSortOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSortOrder(opt as 'NEWEST' | 'OLDEST')}
                        style={{
                          backgroundColor: 'transparent',
                          color: sortOrder === opt ? '#ffffff' : '#666666',
                          border: 'none',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          letterSpacing: '1px',
                          fontWeight: sortOrder === opt ? 'bold' : 'normal',
                          cursor: 'pointer',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* STATUS FILTER */}
                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    AMBASSADOR STATUS
                  </label>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', width: '100%' }}>
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status as any)}
                        style={{
                          backgroundColor: 'transparent',
                          color: statusFilter === status ? '#ffffff' : '#666666',
                          border: 'none',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          letterSpacing: '1px',
                          fontWeight: statusFilter === status ? 'bold' : 'normal',
                          cursor: 'pointer',
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SALES FILTER */}
                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    SALES FILTER
                  </label>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', width: '100%' }}>
                    {salesOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSalesFilter(opt.value as any)}
                        style={{
                          backgroundColor: 'transparent',
                          color: salesFilter === opt.value ? '#ffffff' : '#666666',
                          border: 'none',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          letterSpacing: '1px',
                          fontWeight: salesFilter === opt.value ? 'bold' : 'normal',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT SECTION */}
          {loading ? (
            <AmbassadorSkeleton />
          ) : errorMessage ? (
            <div style={{ backgroundColor: '#110505', border: '1px solid #441111', color: '#ff6b6b', padding: '12px', borderRadius: '2px', fontSize: '11px', fontFamily: 'monospace' }}>
              ERROR: {errorMessage}
            </div>
          ) : filteredAmbassadors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#050505', border: '1px solid #222', borderRadius: '2px' }}>
              NO AMBASSADORS FOUND MATCHING CRITERIA.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredAmbassadors.map((amb) => {
                const isBlocked = amb.status?.toUpperCase() === 'BLOCKED' || amb.status?.toUpperCase() === 'DEACTIVATED';
                const fullLink = amb.assigned_slug ? `${baseUrl}/${amb.assigned_slug}` : 'N/A';
                const messageUrl = `/admin?tab=messages&search=${encodeURIComponent(amb.email || amb.name)}&from=ambassadors`;

                return (
                  <div
                    key={amb.id}
                    style={{
                      backgroundColor: '#050505',
                      border: '1px solid #222',
                      padding: '14px 16px',
                      borderRadius: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      {/* LEFT DETAILS */}
                      <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                        <a
                          href={messageUrl}
                          onClick={(e) => handleOpenMessages(e, amb.email || amb.name)}
                          style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textDecoration: 'none', display: 'block' }}
                        >
                          {amb.name}
                        </a>
                        <a
                          href={messageUrl}
                          onClick={(e) => handleOpenMessages(e, amb.email || amb.name)}
                          style={{ fontSize: '11px', color: '#888', marginTop: '2px', fontFamily: 'monospace', textDecoration: 'none', display: 'block' }}
                        >
                          {amb.email}
                        </a>
                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px', fontFamily: 'monospace' }}>
                          TOTAL SALES: <span style={{ color: '#64ffda', fontWeight: 'bold' }}>{amb.total_sales || 0}</span>
                        </div>
                      </div>

                      {/* RIGHT ACTIONS */}
                      <div style={{ flexShrink: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedAmbassador(amb)}
                          style={{
                            backgroundColor: '#111122',
                            color: '#2997ff',
                            border: '1px solid #1a3a5c',
                            padding: '6px 10px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '2px',
                          }}
                        >
                          + PRODUCTS
                        </button>

                        {!isBlocked ? (
                          <button
                            type="button"
                            onClick={() => handleBlockAmbassador(amb.id, amb.assigned_slug)}
                            disabled={actionLoading === amb.id}
                            style={{
                              backgroundColor: '#082210',
                              color: '#4dff88',
                              border: '1px solid #115522',
                              padding: '6px 14px',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              borderRadius: '2px',
                            }}
                          >
                            {actionLoading === amb.id ? 'PROCESSING...' : 'ACTIVE'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateAmbassador(amb.id)}
                            disabled={actionLoading === amb.id}
                            style={{
                              backgroundColor: '#220808',
                              color: '#ff4d4d',
                              border: '1px solid #551111',
                              padding: '6px 14px',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              borderRadius: '2px',
                            }}
                          >
                            {actionLoading === amb.id ? 'PROCESSING...' : 'DEACTIVATED'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* STORE LINK */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontFamily: 'monospace', color: '#555', borderTop: '1px solid #111', paddingTop: '8px' }}>
                      <span>LINK:</span>
                      {amb.assigned_slug ? (
                        <a href={fullLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2997ff', textDecoration: 'none' }}>
                          {fullLink}
                        </a>
                      ) : (
                        <span style={{ color: '#666' }}>N/A</span>
                      )}
                    </div>
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
          onClose={() => setSelectedAmbassador(null)}
        />
      )}
    </div>
  );
}
