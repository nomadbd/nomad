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
      backgroundColor: '#0A0A0C',
      border: '1px solid #1F1F22',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* প্রিমিয়াম লেবেল */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontSize: '11px',
          color: '#888888',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1.5px'
        }}>
          PUBLIC STOREFRONT URL
        </span>
      </div>

      {/* লিংক ইনপুট ও শেয়ার আইকন বাটন */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%'
      }}>
        {/* লিংক বক্স (বেশি বড় হলে ... অটোমেটিক যুক্ত হবে) */}
        <div style={{
          flex: 1,
          backgroundColor: '#000000',
          border: '1px solid #222225',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          color: storeUrl ? '#E4E4E7' : '#52525B',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontFamily: 'monospace',
          minWidth: 0
        }}>
          {loading ? 'Generating link...' : (storeUrl || 'No storefront assigned')}
        </div>

        {/* শুধুমাত্র শেয়ার আইকন বাটন */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={handleShare}
            disabled={!storeUrl}
            title={copied ? 'Copied to clipboard!' : 'Share / Copy URL'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              backgroundColor: storeUrl ? (copied ? '#059669' : '#10B981') : '#18181B',
              color: storeUrl ? '#FFFFFF' : '#3F3F46',
              border: 'none',
              borderRadius: '8px',
              cursor: storeUrl ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            <ShareIcon width={16} height={16} stroke={storeUrl ? "#FFFFFF" : "#3F3F46"} />
          </button>

          {/* লিংক কপি হলে পপআপ নোটিফিকেশন */}
          {copied && (
            <div style={{
              position: 'absolute',
              bottom: '46px',
              right: '0',
              backgroundColor: '#10B981',
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
