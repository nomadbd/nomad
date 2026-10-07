import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AmbassadorSkeleton from './AmbassadorSkeleton';
import ProductManager from './ProductManager';
import PayoutManager from '@/components/admin/ambassadors/payouts/PayoutManager';

import {
  AmbassadorCard,
  AmbassadorBottomSheet,
  AmbassadorTabs,
  AmbassadorFilterBar,
  AmbassadorSalesSheet,
  AmbassadorProfile,
} from './_components';

interface AmbassadorListProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  onOpenChat?: (ambassadorId: string, ambassadorEmail: string) => void;
}

export default function AmbassadorList({
  searchQuery = '',
  isFilterOpen = true,
  onOpenChat,
}: AmbassadorListProps) {
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState<'AMBASSADORS' | 'PAYOUTS'>('AMBASSADORS');
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [pendingPayoutCount, setPendingPayoutCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [bottomSheetAmbassador, setBottomSheetAmbassador] = useState<AmbassadorProfile | null>(null);
  const [selectedAmbassadorForProducts, setSelectedAmbassadorForProducts] = useState<AmbassadorProfile | null>(null);
  const [selectedAmbassadorForSales, setSelectedAmbassadorForSales] = useState<AmbassadorProfile | null>(null);

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
          avatar_url,
          created_at,
          ambassador (
            id,
            assigned_slug,
            total_sales,
            total_earned,
            commission_rate,
            discount_percent,
            unpaid_balance,
            pending_balance,
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
            avatar_url: item.avatar_url || null,
            assigned_slug: ambData?.assigned_slug || '',
            created_at: item.created_at || '',
            total_sales: ambData?.total_sales || 0,
            total_earned: ambData?.total_earned || 0,
            commission_rate: ambData?.commission_rate || 0,
            discount_percent: ambData?.discount_percent || 0,
            unpaid_balance: ambData?.unpaid_balance || 0,
            pending_balance: ambData?.pending_balance || 0,
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

  const handleSendMessage = (ambassador: AmbassadorProfile) => {
    setBottomSheetAmbassador(null);
    if (onOpenChat) {
      onOpenChat(ambassador.id, ambassador.email);
    } else {
      navigate(`/admin?tab=messages&userId=${ambassador.id}`);
    }
  };

  const handleOpenEmail = (email: string) => {
    if (!email || email === 'No Email') {
      alert('Email not available');
      return;
    }
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
    <div style={{ width: '100%', color: '#ffffff', fontFamily: 'monospace, sans-serif' }}>
      <AmbassadorTabs
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        ambassadorCount={ambassadors.length}
        pendingPayoutCount={pendingPayoutCount}
      />

      {activeSubTab === 'PAYOUTS' ? (
        <PayoutManager isFilterOpen={isFilterOpen} />
      ) : (
        <>
          {isFilterOpen && (
            <AmbassadorFilterBar sortOrder={sortOrder} setSortOrder={setSortOrder} />
          )}

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
              {filteredAmbassadors.map((amb) => (
                <AmbassadorCard
                  key={amb.id}
                  ambassador={amb}
                  baseUrl={baseUrl}
                  actionLoading={actionLoading}
                  copiedSlug={copiedSlug}
                  onSelect={setBottomSheetAmbassador}
                  onToggleStatus={handleToggleStatus}
                  onOpenProducts={setSelectedAmbassadorForProducts}
                  onOpenSalesBreakdown={(selected) => setSelectedAmbassadorForSales(selected)}
                  onOpenPayouts={() => setActiveSubTab('PAYOUTS')}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>
          )}
        </>
      )}

      {bottomSheetAmbassador && (
        <AmbassadorBottomSheet
          ambassador={bottomSheetAmbassador}
          onClose={() => setBottomSheetAmbassador(null)}
          onSendMessage={handleSendMessage}
          onOpenEmail={handleOpenEmail}
          onOpenProducts={(amb) => {
            setBottomSheetAmbassador(null);
            setSelectedAmbassadorForProducts(amb);
          }}
          onOpenPayouts={() => {
            setBottomSheetAmbassador(null);
            setActiveSubTab('PAYOUTS');
          }}
          onToggleStatus={handleToggleStatus}
          onUpdateSuccess={fetchAmbassadorsAndStats}
        />
      )}

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

      {selectedAmbassadorForSales && (
        <AmbassadorSalesSheet
          ambassador={selectedAmbassadorForSales}
          onClose={() => setSelectedAmbassadorForSales(null)}
        />
      )}
    </div>
  );
}
