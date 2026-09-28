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
  
  // আসল পূর্ণাঙ্গ ইউআরএল (শেয়ারের জন্য)
  const storeUrl = origin && slug ? `${origin.replace(/\/+$/, '')}/${slug}` : '';
  
  // মূল ডোমেইন (https:// ছাড়া)
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
      } catch {
        // Native share cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div style={{
      backgroundColor: '#050505',
      border: '1px solid #1a1a1a',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* হেডার টাইটেল */}
      <span style={{
        fontSize: '10px',
        color: '#71717A',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        PUBLIC STOREFRONT URL
      </span>

      {/* ২-লাইনের ইউআরএল এবং শেয়ার বাটন */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%'
      }}>
        {/* ২-লাইনের স্ট্যাকড টেক্সট সেকশন */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          minWidth: 0
        }}>
          {loading ? (
            <span style={{ fontSize: '12px', color: '#52525B' }}>Loading URL...</span>
          ) : !slug ? (
            <span style={{ fontSize: '12px', color: '#52525B' }}>No storefront assigned</span>
          ) : (
            <>
              {/* ১ম লাইন: ডোমেইন (Muted) */}
              <span style={{
                fontSize: '11px',
                color: '#71717A',
                fontFamily: 'monospace',
                lineHeight: '1.2'
              }}>
                {displayDomain} /
              </span>

              {/* ২য় লাইন: বড় স্লাগ (Highlight & Wrap support) */}
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#FFFFFF',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                lineHeight: '1.3'
              }}>
                {slug}
              </span>
            </>
          )}
        </div>

        {/* ডানের ডার্ক শেয়ার বাটন */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={handleShare}
            disabled={!storeUrl}
            title={copied ? 'Copied!' : 'Share / Copy URL'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              backgroundColor: '#111111',
              border: '1px solid #222222',
              borderRadius: '6px',
              color: storeUrl ? '#FFFFFF' : '#444444',
              cursor: storeUrl ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            <ShareIcon width={15} height={15} stroke={storeUrl ? "#FFFFFF" : "#444444"} />
          </button>

          {copied && (
            <div style={{
              position: 'absolute',
              bottom: '46px',
              right: '0',
              backgroundColor: '#111111',
              border: '1px solid #333333',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: '600',
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
