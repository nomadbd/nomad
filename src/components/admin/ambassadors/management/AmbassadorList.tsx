import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface AmbassadorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'BLOCKED' | string;
  assigned_slug: string;
  created_at?: string;
  total_sales?: number;
  total_revenue?: number;
  commission_earned?: number;
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

  // Edit Slug State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSlugInput, setNewSlugInput] = useState<string>('');

  // Expandable Details State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter States
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [salesFilter, setSalesFilter] = useState<'ALL' | 'HIGHEST' | 'LOWEST' | 'NO_SALES'>('ALL');

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
          phone,
          status,
          created_at,
          ambassador (
            assigned_slug,
            total_sales,
            total_revenue,
            commission_earned
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
            phone: item.phone || '',
            status: (item.status || 'ACTIVE').toUpperCase(),
            assigned_slug: ambData?.assigned_slug || 'N/A',
            created_at: item.created_at || '',
            total_sales: ambData?.total_sales || 0,
            total_revenue: ambData?.total_revenue || 0,
            commission_earned: ambData?.commission_earned || 0,
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

  // --- ACTIONS ---

  // 1. Block / Unblock Toggle
  const handleToggleStatus = async (amb: AmbassadorProfile) => {
    const isCurrentlyBlocked = amb.status === 'BLOCKED';
    const actionText = isCurrentlyBlocked ? 'activate' : 'block';
    
    if (!window.confirm(`Are you sure you want to ${actionText} ${amb.name}?`)) return;

    setActionLoading(amb.id);
    try {
      const rpcName = isCurrentlyBlocked ? 'activate_ambassador' : 'deactivate_ambassador';
      const { error } = await supabase.rpc(rpcName, { target_user_id: amb.id });
      
      if (error) {
        // Fallback direct update if RPC fails
        await supabase
          .from('profiles')
          .update({ status: isCurrentlyBlocked ? 'ACTIVE' : 'BLOCKED' })
          .eq('id', amb.id);
      }
      
      fetchAmbassadors();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Edit Link / Slug
  const handleSaveSlug = async (userId: string) => {
    if (!newSlugInput.trim()) return;
    setActionLoading(userId);
    try {
      const formattedSlug = newSlugInput.trim().toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('ambassador')
        .update({ assigned_slug: formattedSlug })
        .eq('user_id', userId);

      if (error) throw error;
      
      setEditingId(null);
      fetchAmbassadors();
    } catch (err: any) {
      alert('Failed to update slug: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Copy Referral Link
  const handleCopyLink = (slug: string, id: string) => {
    const fullUrl = `${window.location.origin}/a/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & Sort Logic
  const filteredAmbassadors = ambassadors
    .filter((amb) => {
      if (statusFilter === 'ACTIVE' && amb.status !== 'ACTIVE') return false;
      if (statusFilter === 'BLOCKED' && amb.status !== 'BLOCKED') return false;

      if (salesFilter === 'NO_SALES' && (amb.total_sales || 0) > 0) return false;

      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = amb.name.toLowerCase().includes(q);
        const matchesEmail = amb.email.toLowerCase().includes(q);
        const matchesSlug = amb.assigned_slug.toLowerCase().includes(q);
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

  // Overview Stats
  const totalActive = ambassadors.filter(a => a.status === 'ACTIVE').length;
  const totalSalesCount = ambassadors.reduce((acc, curr) => acc + (curr.total_sales || 0), 0);

  return (
    <div style={{ width: '100%', color: '#ffffff', fontFamily: 'monospace' }}>
      
      {/* ---------------- FILTER EXPANDABLE PANEL ---------------- */}
      {isFilterOpen && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              backgroundColor: '#050505',
              border: '1px solid #222',
              padding: '16px',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* JOIN DATE SORT */}
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>
                SORT BY JOIN DATE
              </label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['NEWEST', 'OLDEST'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setSortOrder(opt as any)}
                    style={{
                      backgroundColor: 'transparent',
                      color: sortOrder === opt ? '#fff' : '#666',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: sortOrder === opt ? 'bold' : 'normal',
                      cursor: 'pointer',
                      letterSpacing: '1px'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* AMBASSADOR STATUS */}
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>
                STATUS FILTER
              </label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['ALL', 'ACTIVE', 'BLOCKED'].map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setStatusFilter(st as any)}
                    style={{
                      backgroundColor: 'transparent',
                      color: statusFilter === st ? '#fff' : '#666',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: statusFilter === st ? 'bold' : 'normal',
                      cursor: 'pointer',
                      letterSpacing: '1px'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* SALES FILTER */}
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>
                PERFORMANCE / SALES
              </label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {[
                  { label: 'ALL', val: 'ALL' },
                  { label: 'HIGHEST SALES', val: 'HIGHEST' },
                  { label: 'LOWEST SALES', val: 'LOWEST' },
                  { label: 'NO SALES (0)', val: 'NO_SALES' },
                ].map((s) => (
                  <button
                    type="button"
                    key={s.val}
                    onClick={() => setSalesFilter(s.val as any)}
                    style={{
                      backgroundColor: 'transparent',
                      color: salesFilter === s.val ? '#fff' : '#666',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: salesFilter === s.val ? 'bold' : 'normal',
                      cursor: 'pointer',
                      letterSpacing: '1px'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- KPI OVERVIEW BAR ---------------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '8px',
          marginBottom: '16px'
        }}
      >
        <div style={{ backgroundColor: '#050505', border: '1px solid #222', padding: '10px', borderRadius: '2px' }}>
          <div style={{ fontSize: '9px', color: '#666' }}>TOTAL AMBASSADORS</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{ambassadors.length}</div>
        </div>
        <div style={{ backgroundColor: '#050505', border: '1px solid #222', padding: '10px', borderRadius: '2px' }}>
          <div style={{ fontSize: '9px', color: '#666' }}>ACTIVE / BLOCKED</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4dff88', marginTop: '2px' }}>
            {totalActive} <span style={{ color: '#ff4d4d', fontSize: '11px' }}>/ {ambassadors.length - totalActive}</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#050505', border: '1px solid #222', padding: '10px', borderRadius: '2px' }}>
          <div style={{ fontSize: '9px', color: '#666' }}>TOTAL SALES ORDERS</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2997ff', marginTop: '2px' }}>{totalSalesCount}</div>
        </div>
      </div>

      {/* ---------------- HEADER BAR ---------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>
          MANAGE AMBASSADORS ({filteredAmbassadors.length})
        </span>
      </div>

      {/* ---------------- AMBASSADOR LIST CARDS ---------------- */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '11px' }}>
          LOADING DATA...
        </div>
      ) : errorMessage ? (
        <div style={{ backgroundColor: '#110505', border: '1px solid #441111', color: '#ff4d4d', padding: '12px', fontSize: '11px' }}>
          {errorMessage}
        </div>
      ) : filteredAmbassadors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#555', backgroundColor: '#050505', border: '1px solid #222', fontSize: '11px' }}>
          NO AMBASSADORS FOUND
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAmbassadors.map((amb) => {
            const isBlocked = amb.status === 'BLOCKED';
            const isEditing = editingId === amb.id;
            const isExpanded = expandedId === amb.id;

            return (
              <div
                key={amb.id}
                style={{
                  backgroundColor: '#050505',
                  border: `1px solid ${isBlocked ? '#331111' : '#222'}`,
                  borderRadius: '2px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* CARD HEADER: NAME & STATUS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{amb.name}</span>
                      <span
                        style={{
                          fontSize: '8px',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          backgroundColor: isBlocked ? '#220808' : '#082210',
                          color: isBlocked ? '#ff4d4d' : '#4dff88',
                          border: `1px solid ${isBlocked ? '#551111' : '#115522'}`,
                          letterSpacing: '1px'
                        }}
                      >
                        {amb.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                      {amb.email} {amb.phone && `• ${amb.phone}`}
                    </div>
                  </div>

                  {/* BLOCK / UNBLOCK ACTION */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(amb)}
                    disabled={actionLoading === amb.id}
                    style={{
                      backgroundColor: '#000',
                      color: isBlocked ? '#4dff88' : '#ff4d4d',
                      border: `1px solid ${isBlocked ? '#114422' : '#441111'}`,
                      padding: '5px 10px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      letterSpacing: '1px'
                    }}
                  >
                    {actionLoading === amb.id ? '...' : isBlocked ? 'ACTIVATE' : 'BLOCK'}
                  </button>
                </div>

                {/* METRICS GRID */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    backgroundColor: '#0a0a0a',
                    padding: '8px 10px',
                    border: '1px solid #1a1a1a',
                    borderRadius: '2px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '8px', color: '#555' }}>SALES COUNT</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2997ff' }}>{amb.total_sales || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', color: '#555' }}>REVENUE</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>৳{amb.total_revenue || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', color: '#555' }}>COMMISSION</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4dff88' }}>৳{amb.commission_earned || 0}</div>
                  </div>
                </div>

                {/* LINK / SLUG SECTION */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid #111', paddingTop: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>LINK:</span>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          type="text"
                          value={newSlugInput}
                          onChange={(e) => setNewSlugInput(e.target.value)}
                          style={{
                            backgroundColor: '#000',
                            color: '#fff',
                            border: '1px solid #444',
                            padding: '2px 6px',
                            fontSize: '10px',
                            width: '110px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSlug(amb.id)}
                          style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '2px 6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          SAVE
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#2997ff', fontWeight: 'bold' }}>/{amb.assigned_slug}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(amb.assigned_slug, amb.id)}
                      style={{
                        backgroundColor: '#111',
                        color: copiedId === amb.id ? '#4dff88' : '#888',
                        border: '1px solid #222',
                        padding: '4px 8px',
                        fontSize: '9px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === amb.id ? 'COPIED!' : 'COPY LINK'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(amb.id);
                        setNewSlugInput(amb.assigned_slug);
                      }}
                      style={{
                        backgroundColor: '#111',
                        color: '#888',
                        border: '1px solid #222',
                        padding: '4px 8px',
                        fontSize: '9px',
                        cursor: 'pointer'
                      }}
                    >
                      EDIT SLUG
                    </button>
                  </div>
                </div>

                {/* BOTTOM QUICK CONTACT & EXPAND DETAILS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  {/* Quick Contact Icons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`mailto:${amb.email}`}
                      style={{ fontSize: '9px', color: '#666', textDecoration: 'underline' }}
                    >
                      EMAIL
                    </a>
                    {amb.phone && (
                      <a
                        href={`https://wa.me/${amb.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '9px', color: '#25D366', textDecoration: 'underline' }}
                      >
                        WHATSAPP
                      </a>
                    )}
                  </div>

                  {/* Toggle Detailed Orders Accordion */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : amb.id)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#555',
                      border: 'none',
                      fontSize: '9px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {isExpanded ? 'HIDE DETAILS ▲' : 'VIEW DETAILS ▼'}
                  </button>
                </div>

                {/* EXPANDED DETAILS (Orders / Recent Activity) */}
                {isExpanded && (
                  <div
                    style={{
                      backgroundColor: '#000',
                      border: '1px solid #1a1a1a',
                      padding: '10px',
                      marginTop: '4px',
                      fontSize: '10px',
                      color: '#888'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>RECENT SALES LOG</div>
                    <div>Joined On: {new Date(amb.created_at || '').toLocaleDateString()}</div>
                    <div>Referral URL: <span style={{ color: '#2997ff' }}>{window.location.origin}/a/{amb.assigned_slug}</span></div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
