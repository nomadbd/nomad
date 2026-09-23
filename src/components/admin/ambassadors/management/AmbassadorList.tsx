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

export default function AmbassadorList({ searchQuery = '', isFilterOpen = false }: AmbassadorListProps) {
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter States (ডিফল্ট অবস্থায় কোনো ফিল্টার সক্রিয় থাকবে না)
  const [sortOrder, setSortOrder] = useState<'NONE' | 'NEWEST' | 'OLDEST'>('NONE');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [salesSort, setSalesSort] = useState<'NONE' | 'HIGHEST' | 'LOWEST'>('NONE');
  const [noSalesOnly, setNoSalesOnly] = useState<boolean>(false);

  const fetchAmbassadors = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // .ilike ব্যবহার করা হয়েছে যাতে 'ambassador' বা 'AMBASSADOR' যেকোনো কেসে ম্যাচ করে
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

      if (error) {
        // যদি ambassador টেবিলে total_sales কলাম না থাকে, তবে ব্যাকআপ ক্যোয়ারি চলবে
        console.warn('Primary query failed, running fallback query...', error.message);
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            status,
            created_at,
            ambassador (
              assigned_slug
            )
          `)
          .ilike('role', 'ambassador')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;

        if (fallbackData) {
          const formattedData: AmbassadorProfile[] = fallbackData.map((item: any) => {
            const ambData = Array.isArray(item.ambassador) ? item.ambassador[0] : item.ambassador;
            return {
              id: item.id,
              name: item.name || 'Unnamed Ambassador',
              email: item.email || 'No Email',
              status: item.status || 'ACTIVE',
              assigned_slug: ambData?.assigned_slug || 'N/A',
              created_at: item.created_at || '',
              total_sales: 0,
            };
          });
          setAmbassadors(formattedData);
          return;
        }
      }

      if (data) {
        const formattedData: AmbassadorProfile[] = data.map((item: any) => {
          const ambData = Array.isArray(item.ambassador) ? item.ambassador[0] : item.ambassador;
          return {
            id: item.id,
            name: item.name || 'Unnamed Ambassador',
            email: item.email || 'No Email',
            status: item.status || 'ACTIVE',
            assigned_slug: ambData?.assigned_slug || 'N/A',
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
      `Are you sure you want to block this ambassador?\nStore link (${currentSlug}) will be deactivated and released.`
    );
    if (!confirmBlock) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('deactivate_ambassador', { target_user_id: userId });
      if (error) throw error;
      alert('Ambassador blocked successfully!');
      fetchAmbassadors();
    } catch (err: any) {
      alert('Failed to block ambassador: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateAmbassador = async (userId: string) => {
    const confirmActivate = window.confirm('Are you sure you want to unblock and activate this ambassador?');
    if (!confirmActivate) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('activate_ambassador', { target_user_id: userId });
      if (error) throw error;
      alert('Ambassador activated successfully!');
      fetchAmbassadors();
    } catch (err: any) {
      alert('Failed to activate ambassador: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const resetAllFilters = () => {
    setSortOrder('NONE');
    setStartDate('');
    setEndDate('');
    setStatusFilter('ALL');
    setSalesSort('NONE');
    setNoSalesOnly(false);
  };

  const isAnyFilterActive =
    sortOrder !== 'NONE' ||
    startDate !== '' ||
    endDate !== '' ||
    statusFilter !== 'ALL' ||
    salesSort !== 'NONE' ||
    noSalesOnly;

  // Filter & Sort Logic
  const filteredAmbassadors = ambassadors
    .filter((amb) => {
      // 1. Status Filter
      if (statusFilter === 'ACTIVE' && amb.status?.toUpperCase() !== 'ACTIVE') return false;
      if (statusFilter === 'BLOCKED' && amb.status?.toUpperCase() !== 'BLOCKED') return false;

      // 2. Zero Sales Filter
      if (noSalesOnly && (amb.total_sales || 0) > 0) return false;

      // 3. Date Filtering (Start & End)
      if (amb.created_at) {
        const ambDateStr = amb.created_at.split('T')[0];
        if (startDate && ambDateStr < startDate) return false;
        if (endDate && ambDateStr > endDate) return false;
      }

      // 4. Search Query
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
      // Sales Sort
      if (salesSort === 'HIGHEST') {
        return (b.total_sales || 0) - (a.total_sales || 0);
      }
      if (salesSort === 'LOWEST') {
        return (a.total_sales || 0) - (b.total_sales || 0);
      }

      // Date Sort
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      if (sortOrder === 'OLDEST') return dateA - dateB;
      if (sortOrder === 'NEWEST') return dateB - dateA;

      return dateB - dateA; // Default sorting
    });

  if (loading) {
    return <div style={loadingStyle}>Loading ambassador list...</div>;
  }

  return (
    <div style={containerStyle}>
      {/* ফিল্টার প্যানেল (মুক্ত পেজে ৩টি সারি) */}
      {isFilterOpen && (
        <div style={freeFilterPanelStyle}>
          {/* লাইন ১: সর্ট ও ডেট */}
          <div style={scrollRowStyle}>
            <button
              onClick={() => setSortOrder(sortOrder === 'NEWEST' ? 'NONE' : 'NEWEST')}
              style={pillButtonStyle(sortOrder === 'NEWEST')}
            >
              ⚡ NEWEST FIRST
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === 'OLDEST' ? 'NONE' : 'OLDEST')}
              style={pillButtonStyle(sortOrder === 'OLDEST')}
            >
              ⏳ OLDEST FIRST
            </button>

            <div style={dateGroupStyle}>
              <span style={dateLabelStyle}>FROM:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={dateInputStyle}
              />
            </div>

            <div style={dateGroupStyle}>
              <span style={dateLabelStyle}>TO:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={dateInputStyle}
              />
            </div>

            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }} style={clearDateBtnStyle}>
                CLEAR DATES
              </button>
            )}
          </div>

          {/* লাইন ২: স্ট্যাটাস ফিল্টার */}
          <div style={scrollRowStyle}>
            <button
              onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
              style={pillButtonStyle(statusFilter === 'ACTIVE')}
            >
              🟢 ACTIVE ONLY
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')}
              style={pillButtonStyle(statusFilter === 'BLOCKED')}
            >
              🔴 BLOCKED ONLY
            </button>
          </div>

          {/* লাইন ৩: সেলস সম্পর্কিত ফিল্টার */}
          <div style={scrollRowStyle}>
            <button
              onClick={() => {
                setSalesSort(salesSort === 'HIGHEST' ? 'NONE' : 'HIGHEST');
                setNoSalesOnly(false);
              }}
              style={pillButtonStyle(salesSort === 'HIGHEST')}
            >
              💰 HIGHEST SALES
            </button>

            <button
              onClick={() => {
                setSalesSort(salesSort === 'LOWEST' ? 'NONE' : 'LOWEST');
                setNoSalesOnly(false);
              }}
              style={pillButtonStyle(salesSort === 'LOWEST')}
            >
              📉 LOWEST SALES
            </button>

            <button
              onClick={() => {
                setNoSalesOnly(!noSalesOnly);
                setSalesSort('NONE');
              }}
              style={pillButtonStyle(noSalesOnly)}
            >
              🚫 NO SALES (0 SALES)
            </button>

            {isAnyFilterActive && (
              <button onClick={resetAllFilters} style={resetButtonStyle}>
                🔄 RESET FILTERS
              </button>
            )}
          </div>
        </div>
      )}

      {/* হেডার পার্ট */}
      <div style={headerSectionStyle}>
        <h2 style={titleStyle}>Manage Ambassadors</h2>
        <span style={countBadgeStyle}>{filteredAmbassadors.length} Total</span>
      </div>

      {/* Error Message থাকলে তা দেখাবে */}
      {errorMessage && (
        <div style={errorContainerStyle}>
          ⚠️ Database Error: {errorMessage}
        </div>
      )}

      {/* অ্যাম্বাসেডর তালিকা */}
      {!errorMessage && filteredAmbassadors.length === 0 ? (
        <div style={emptyStyle}>No ambassadors found matching criteria.</div>
      ) : (
        <div style={listGridStyle}>
          {filteredAmbassadors.map((amb) => {
            const isBlocked = amb.status?.toUpperCase() === 'BLOCKED';

            return (
              <div key={amb.id} style={cardStyle}>
                <div style={infoGroupStyle}>
                  <div style={nameRowStyle}>
                    <h4 style={nameStyle}>{amb.name}</h4>
                    <span style={statusBadgeStyle(isBlocked)}>
                      {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                    </span>
                    <span style={salesBadgeStyle}>
                      Sales: {amb.total_sales || 0}
                    </span>
                  </div>
                  <p style={emailStyle}>{amb.email}</p>
                  <div style={slugRowStyle}>
                    <span style={slugLabelStyle}>Link:</span>
                    <span style={slugValueStyle}>/{amb.assigned_slug}</span>
                  </div>
                </div>

                <div style={actionGroupStyle}>
                  {!isBlocked ? (
                    <button
                      onClick={() => handleBlockAmbassador(amb.id, amb.assigned_slug)}
                      disabled={actionLoading === amb.id}
                      style={blockButtonStyle}
                    >
                      {actionLoading === amb.id ? 'Processing...' : 'Block Ambassador'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateAmbassador(amb.id)}
                      disabled={actionLoading === amb.id}
                      style={activateButtonStyle}
                    >
                      {actionLoading === amb.id ? 'Processing...' : 'Activate / Unblock'}
                    </button>
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

// ---------------- STYLES ----------------

const containerStyle: React.CSSProperties = {
  padding: '20px 16px',
  color: '#ffffff',
  maxWidth: '800px',
  margin: '0 auto',
};

const freeFilterPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '20px',
  padding: '0 4px',
};

const scrollRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  paddingBottom: '4px',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
};

const pillButtonStyle = (isActive: boolean): React.CSSProperties => ({
  backgroundColor: isActive ? '#ffffff' : '#141414',
  color: isActive ? '#000000' : '#888888',
  border: isActive ? '1px solid #ffffff' : '1px solid #282828',
  borderRadius: '20px',
  padding: '6px 14px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'all 0.2s ease',
  fontFamily: 'monospace, sans-serif',
});

const resetButtonStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '20px',
  padding: '6px 14px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  fontFamily: 'monospace, sans-serif',
};

const dateGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#141414',
  border: '1px solid #282828',
  borderRadius: '20px',
  padding: '2px 10px',
  flexShrink: 0,
};

const dateLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#666666',
  fontWeight: 700,
};

const dateInputStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#ffffff',
  border: 'none',
  outline: 'none',
  fontSize: '11px',
  fontFamily: 'monospace, sans-serif',
  cursor: 'pointer',
};

const clearDateBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888888',
  fontSize: '10px',
  cursor: 'pointer',
  textDecoration: 'underline',
  flexShrink: 0,
};

const headerSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '-0.02em',
};

const countBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  padding: '4px 10px',
  borderRadius: '20px',
  color: '#86868b',
};

const listGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(18, 18, 18, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '16px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backdropFilter: 'blur(10px)',
  flexWrap: 'wrap',
  gap: '12px',
};

const infoGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const nameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
};

const nameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: '#ffffff',
};

const emailStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#86868b',
};

const slugRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '4px',
};

const slugLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6e6e73',
};

const slugValueStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#2997ff',
  fontWeight: 500,
};

const statusBadgeStyle = (isBlocked: boolean): React.CSSProperties => ({
  fontSize: '9px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '6px',
  letterSpacing: '0.05em',
  backgroundColor: isBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
  color: isBlocked ? '#ef4444' : '#22c55e',
  border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
});

const salesBadgeStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '6px',
  letterSpacing: '0.05em',
  backgroundColor: 'rgba(41, 151, 255, 0.15)',
  color: '#2997ff',
  border: '1px solid rgba(41, 151, 255, 0.3)',
};

const actionGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const blockButtonStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  padding: '8px 14px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const activateButtonStyle: React.CSSProperties = {
  backgroundColor: 'rgba(34, 197, 94, 0.12)',
  color: '#22c55e',
  border: '1px solid rgba(34, 197, 94, 0.3)',
  padding: '8px 14px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const loadingStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#86868b',
  fontSize: '13px',
};

const emptyStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#6e6e73',
  fontSize: '13px',
};

const errorContainerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  padding: '12px 16px',
  borderRadius: '12px',
  fontSize: '13px',
  marginBottom: '16px',
};
