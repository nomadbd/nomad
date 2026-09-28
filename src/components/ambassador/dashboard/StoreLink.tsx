import React, { useState, useEffect } from 'react';
import { ShareIcon } from '../../icons';

interface StoreLinkProps {
  assignedSlug?: string;
  ambassadorData?: {
    assigned_slug?: string;
    [key: string]: any;
  };
  profile?: any;
  loading?: boolean;
}

export default function StoreLink({
  assignedSlug,
  ambassadorData,
  profile,
  loading = false
}: StoreLinkProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const rawSlug = assignedSlug || ambassadorData?.assigned_slug || profile?.assigned_slug || '';
  const slug = typeof rawSlug === 'string' ? rawSlug.trim().replace(/^\/+|\/+$/g, '') : '';
  const storeUrl = origin && slug ? `${origin.replace(/\/+$/, '')}/${slug}` : '';
  const displayDomain = origin.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  const handleShare = async () => {
    if (!storeUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Curated Storefront',
          text: 'Check out my curated collection!',
          url: storeUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div style={{
      padding: '16px 0',
      borderBottom: '1px solid #1a1a1a', // আলাদা বোতলজাত কার্ডের বদলে ক্লিন ডিভাইডার
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '10px',
          color: '#71717A',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1.5px'
        }}>
          YOUR STOREFRONT LINK
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
          {loading ? (
            <span style={{ fontSize: '12px', color: '#52525B' }}>Loading URL...</span>
          ) : !slug ? (
            <span style={{ fontSize: '12px', color: '#52525B' }}>No storefront assigned</span>
          ) : (
            <>
              <span style={{ fontSize: '11px', color: '#71717A', fontFamily: 'monospace' }}>
                {displayDomain} /
              </span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {slug}
              </span>
            </>
          )}
        </div>

        <button
          onClick={handleShare}
          disabled={!storeUrl}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
            color: '#FFFFFF',
            cursor: storeUrl ? 'pointer' : 'not-allowed',
            flexShrink: 0
          }}
        >
          <ShareIcon width={15} height={15} stroke={storeUrl ? "#FFFFFF" : "#444444"} />
        </button>
      </div>
    </div>
  );
}
