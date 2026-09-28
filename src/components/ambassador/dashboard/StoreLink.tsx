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
      backgroundColor: '#050505',
      border: '1px solid #1a1a1a',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* প্রিমিয়াম টাইটেল / হেডার */}
      <span style={{
        fontSize: '10px',
        color: '#888888',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        PUBLIC STOREFRONT URL
      </span>

      {/* লিংক ও মিনিমাল শেয়ার আইকন সেকশন */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%'
      }}>
        {/* কোনো ইনার ব্যাকগ্রাউন্ড/বক্স ছাড়া একদম মুক্ত টেক্সট লিংক */}
        <div style={{
          fontSize: '13px',
          color: storeUrl ? '#FFFFFF' : '#666666',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontFamily: 'monospace',
          flex: 1,
          minWidth: 0
        }}>
          {loading ? 'Loading URL...' : (storeUrl || 'No storefront assigned')}
        </div>

        {/* মিনিমাল ডার্ক শেয়ার বাটন (সবুজ বাটন তুলে দেওয়া হয়েছে) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={handleShare}
            disabled={!storeUrl}
            title={copied ? 'Copied!' : 'Share / Copy URL'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
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

          {/* লিংক কপি হলে অতি সূক্ষ্ম টোস্ট নোটিফিকেশন */}
          {copied && (
            <div style={{
              position: 'absolute',
              bottom: '44px',
              right: '0',
              backgroundColor: '#111111',
              border: '1px solid #333333',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: '600',
              padding: '3px 8px',
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
