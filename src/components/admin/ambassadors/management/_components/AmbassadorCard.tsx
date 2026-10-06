import React from 'react';
import { ShareIcon } from '@/components/icons';

export interface AmbassadorProfile {
  id: string;
  ambassador_id: string;
  name: string;
  email: string;
  status: string;
  assigned_slug: string;
  created_at?: string;
  total_sales?: number;
  assigned_products_count?: number;
}

interface AmbassadorCardProps {
  ambassador: AmbassadorProfile;
  baseUrl: string;
  actionLoading: string | null;
  copiedSlug: string | null;
  onSelect: (amb: AmbassadorProfile) => void;
  onToggleStatus: (amb: AmbassadorProfile) => void;
  onOpenProducts: (amb: AmbassadorProfile) => void;
  onOpenSalesBreakdown?: (amb: AmbassadorProfile) => void;
  onCopyLink: (e: React.MouseEvent, fullUrl: string, slug: string) => void;
}

export const AmbassadorCard: React.FC<AmbassadorCardProps> = ({
  ambassador: amb,
  baseUrl,
  actionLoading,
  onSelect,
  onToggleStatus,
  onOpenProducts,
  onOpenSalesBreakdown,
  onCopyLink,
}) => {
  const isBlocked = amb.status?.toUpperCase() === 'BLOCKED' || amb.status?.toUpperCase() === 'DEACTIVATED';
  const fullLink = amb.assigned_slug ? `${baseUrl}/${amb.assigned_slug}` : '';
  const shortDisplayLink = amb.assigned_slug ? `${baseUrl.replace(/^https?:\/\//, '')}/${amb.assigned_slug}` : 'N/A';

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: amb.name,
          text: `${amb.name}'s Ambassador Store`,
          url: fullLink,
        });
      } catch (err) {
        // Share cancelled or not supported
      }
    } else {
      onCopyLink(e, fullLink, amb.assigned_slug);
    }
  };

  return (
    <div
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
      {/* Top Header: Name, Email & Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div onClick={() => onSelect(amb)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '-0.2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {amb.name}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#71717a',
              marginTop: '2px',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {amb.email}
          </div>
        </div>

        <div
          onClick={() => onToggleStatus(amb)}
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
            flexShrink: 0,
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isBlocked ? '#ef4444' : '#22c55e' }} />
          {actionLoading === amb.id ? 'UPDATING...' : isBlocked ? 'DEACTIVATED' : 'ACTIVE'}
        </div>
      </div>

      {/* Middle Stats: Total Sales & Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <div
          onClick={() => onOpenSalesBreakdown?.(amb)}
          style={{
            backgroundColor: '#121215',
            border: '1px solid #1f1f23',
            padding: '10px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            TOTAL SALES
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px', fontFamily: 'monospace' }}>
            ৳{(amb.total_sales || 0).toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onOpenProducts(amb)}
          style={{
            backgroundColor: '#121215',
            border: '1px solid #1f1f23',
            padding: '10px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '8px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            PRODUCTS
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px', fontFamily: 'monospace' }}>
            {amb.assigned_products_count || 0} <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 'normal' }}>items</span>
          </div>
        </div>
      </div>

      {/* Bottom Share Link Bar */}
      {amb.assigned_slug && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000000', border: '1px solid #1a1a1e', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: 'monospace' }}>
          <span style={{ color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
            {shortDisplayLink}
          </span>
          <button
            type="button"
            onClick={handleShare}
            style={{
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Share Link"
          >
            <ShareIcon style={{ width: '14px', height: '14px', color: '#ffffff' }} />
          </button>
        </div>
      )}
    </div>
  );
};
