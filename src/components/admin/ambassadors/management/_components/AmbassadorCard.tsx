import React from 'react';
import { CheckIcon, ShareIcon, CartIcon } from '@/components/icons';

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
  onCopyLink: (e: React.MouseEvent, fullUrl: string, slug: string) => void;
}

export const AmbassadorCard: React.FC<AmbassadorCardProps> = ({
  ambassador: amb,
  baseUrl,
  actionLoading,
  copiedSlug,
  onSelect,
  onToggleStatus,
  onOpenProducts,
  onCopyLink,
}) => {
  const isBlocked = amb.status?.toUpperCase() === 'BLOCKED' || amb.status?.toUpperCase() === 'DEACTIVATED';
  const fullLink = amb.assigned_slug ? `${baseUrl}/${amb.assigned_slug}` : '';
  const shortDisplayLink = amb.assigned_slug ? `${baseUrl.replace(/^https?:\/\//, '')}/${amb.assigned_slug}` : 'N/A';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div onClick={() => onSelect(amb)} style={{ cursor: 'pointer', flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.2px' }}>
            {amb.name}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px', fontFamily: 'monospace' }}>
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
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isBlocked ? '#ef4444' : '#22c55e' }} />
          {actionLoading === amb.id ? 'UPDATING...' : isBlocked ? 'DEACTIVATED' : 'ACTIVE'}
        </div>
      </div>

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
          onClick={() => onOpenProducts(amb)}
          style={{
            backgroundColor: '#121215',
            border: '1px solid #1f1f23',
            padding: '10px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '8px', color: '#2997ff', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 'bold' }}>
              ASSIGNED PRODUCTS
            </div>
            <CartIcon style={{ width: '12px', height: '12px', color: '#2997ff' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px', fontFamily: 'monospace' }}>
            {amb.assigned_products_count || 0} <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 'normal' }}>items</span>
          </div>
        </div>
      </div>

      {amb.assigned_slug && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000000', border: '1px solid #1a1a1e', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: 'monospace' }}>
          <span style={{ color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
            {shortDisplayLink}
          </span>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
            <button
              type="button"
              onClick={(e) => onCopyLink(e, fullLink, amb.assigned_slug)}
              style={{ backgroundColor: 'transparent', color: copiedSlug === amb.assigned_slug ? '#64ffda' : '#a1a1aa', border: 'none', cursor: 'pointer', fontSize: '10px', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {copiedSlug === amb.assigned_slug ? (
                <CheckIcon style={{ width: '12px', height: '12px' }} />
              ) : (
                'COPY'
              )}
            </button>
            <a
              href={fullLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2997ff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              title="Open Link"
            >
              <ShareIcon style={{ width: '12px', height: '12px' }} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
