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
      padding: '16px 0 20px 0',
      borderBottom: '1px solid #1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* হেডার টাইটেল */}
      <span style={{
        fontSize: '10px',
        color: '#666666',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '1.5px'
      }}>
        YOUR STOREFRONT LINK
      </span>

      {/* ২-লাইনের ইউআরএল এবং সার্কেল শেয়ার বাটন */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        width: '100%'
      }}>
        {/* ২-লাইনের স্ট্যাকড টেক্সট */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          minWidth: 0
        }}>
          {loading ? (
            <span style={{ fontSize: '12px', color: '#555555' }}>Loading URL...</span>
          ) : !slug ? (
            <span style={{ fontSize: '12px', color: '#555555' }}>No storefront assigned</span>
          ) : (
            <>
              {/* ১ম লাইন: মূল ডোমেইন */}
              <span style={{
                fontSize: '11px',
                color: '#666666',
                fontFamily: 'monospace',
                lineHeight: '1.2'
              }}>
                {displayDomain} /
              </span>

              {/* ২য় লাইন: প্রমিনেন্ট স্লাগ */}
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#FFFFFF',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                lineHeight: '1.2',
                letterSpacing: '-0.3px'
              }}>
                {slug}
              </span>
            </>
          )}
        </div>

        {/* ডানপাশের সার্কুলার বোতাম (Circular Button) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={handleShare}
            disabled={!storeUrl}
            title={copied ? 'Copied!' : 'Share / Copy URL'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: '#111111',
              border: '1px solid #222222',
              borderRadius: '50%', // সম্পূর্ণ সার্কেল
              color: '#FFFFFF',
              cursor: storeUrl ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            <ShareIcon width={16} height={16} stroke={storeUrl ? "#FFFFFF" : "#444444"} />
          </button>

          {/* Copied টুলটিপ */}
          {copied && (
            <div style={{
              position: 'absolute',
              bottom: '48px',
              right: '50%',
              transform: 'translateX(50%)',
              backgroundColor: '#1f1f1f',
              border: '1px solid #333333',
              color: '#4dff88',
              fontSize: '10px',
              fontWeight: '700',
              padding: '4px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              letterSpacing: '0.5px'
            }}>
              COPIED!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
