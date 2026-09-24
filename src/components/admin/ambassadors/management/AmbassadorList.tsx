import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface AmbassadorProfile {
  id: string;
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
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter States
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [salesFilter, setSalesFilter] = useState<'ALL' | 'HIGHEST' | 'LOWEST' | 'NO_SALES'>('ALL');

  // Dynamic Base URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourwebsite.com';

  const fetchAmbassadors = async () => {
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
    } catch (err: any) {
      console.error('Error fetching ambassadors:', err.message);
      setErrorMessage(err.message || 'Failed to fetch ambassadors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const handleBlockAmbassador = async (userId: string, currentSlug: string) => {
    const confirmBlock = window.confirm(
      `Are you sure you want to deactivate this ambassador?\nStore link (${currentSlug}) will be deactivated.`
    );
    if (!confirmBlock) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('deactivate_ambassador', { target_user_id: userId });
      if (error) throw error;
      fetchAmbassadors();
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
      fetchAmbassadors();
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
      {/* ---------------- FILTER SECTION ---------------- */}
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
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  color: '#666',
                  marginBottom: '6px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                SORT BY JOIN DATE
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '2px',
                  width: '100%',
                }}
              >
                {dateSortOptions.map((opt) => {
                  const isActive = sortOrder === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setSortOrder(opt as 'NEWEST' | 'OLDEST')}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AMBASSADOR STATUS */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  color: '#666',
                  marginBottom: '6px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                AMBASSADOR STATUS
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '2px',
                  width: '100%',
                }}
              >
                {statusOptions.map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setStatusFilter(status as 'ALL' | 'ACTIVE' | 'BLOCKED')}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SALES FILTER */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '9px',
                  color: '#666',
                  marginBottom: '6px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                SALES FILTER
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '2px',
                  width: '100%',
                }}
              >
                {salesOptions.map((opt) => {
                  const isActive = salesFilter === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() =>
                        setSalesFilter(opt.value as 'ALL' | 'HIGHEST' | 'LOWEST' | 'NO_SALES')
                      }
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- HEADER BAR ---------------- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          padding: '0 2px',
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            margin: 0,
            fontFamily: 'monospace',
          }}
        >
          Manage Ambassadors
        </h2>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            backgroundColor: '#111',
            border: '1px solid #222',
            padding: '3px 8px',
            borderRadius: '2px',
            color: '#888',
          }}
        >
          {filteredAmbassadors.length} TOTAL
        </span>
      </div>

      {/* ---------------- CONTENT SECTION ---------------- */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '11px', fontFamily: 'monospace' }}>
          LOADING AMBASSADORS...
        </div>
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
            const messageUrl = `/messages?recipient=${amb.id}`;

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
                <div
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  {/* LEFT DETAILS CONTAINER */}
                  <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                    {/* NAME (CLICKABLE LINK TO MESSAGES) */}
                    <a
                      href={messageUrl}
                      title={`Send message to ${amb.name}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2997ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#fff')}
                    >
                      {amb.name}
                    </a>

                    {/* EMAIL (CLICKABLE LINK TO MESSAGES) */}
                    <a
                      href={messageUrl}
                      title={`Send message to ${amb.email}`}
                      style={{
                        fontSize: '11px',
                        color: '#888',
                        marginTop: '2px',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2997ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
                    >
                      {amb.email}
                    </a>

                    {/* TOTAL SALES */}
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#aaa',
                        marginTop: '6px',
                        fontFamily: 'monospace',
                      }}
                    >
                      TOTAL SALES:{' '}
                      <span style={{ color: '#64ffda', fontWeight: 'bold' }}>
                        {amb.total_sales || 0}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT ACTION BUTTON */}
                  <div style={{ flexShrink: 0 }}>
                    {!isBlocked ? (
                      <button
                        type="button"
                        onClick={() => handleBlockAmbassador(amb.id, amb.assigned_slug)}
                        disabled={actionLoading === amb.id}
                        title="Click to deactivate"
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
                          letterSpacing: '1px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {actionLoading === amb.id ? 'PROCESSING...' : 'ACTIVE'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivateAmbassador(amb.id)}
                        disabled={actionLoading === amb.id}
                        title="Click to activate"
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
                          letterSpacing: '1px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {actionLoading === amb.id ? 'PROCESSING...' : 'DEACTIVATED'}
                      </button>
                    )}
                  </div>
                </div>

                {/* FULL LINK DISPLAY */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#555',
                    borderTop: '1px solid #111',
                    paddingTop: '8px',
                    wordBreak: 'break-all',
                  }}
                >
                  <span>LINK:</span>
                  {amb.assigned_slug ? (
                    <a
                      href={fullLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2997ff', textDecoration: 'none' }}
                    >
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
    </div>
  );
}
