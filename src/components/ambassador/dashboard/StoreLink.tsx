import React, { useState, useEffect } from 'react';
import { ShareIcon } from '../../icons';

interface StoreLinkProps {
  assignedSlug?: string;
  ambassadorData?: any;
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

  // বিভিন্ন উৎস থেকে slug তুলে আনার সেফ লজিক
  const rawSlug =
    assignedSlug ||
    ambassadorData?.assigned_slug ||
    ambassadorData?.slug ||
    ambassadorData?.token ||
    profile?.assigned_slug ||
    profile?.slug ||
    '';

  const slug = typeof rawSlug === 'string' ? rawSlug.trim().replace(/^\/+|\/+$/g, '') : '';
  const cleanOrigin = origin.replace(/\/+$/, '');

  const storeUrl = cleanOrigin && slug ? `${cleanOrigin}/${slug}` : '';

  const handleShare = async () => {
    if (!storeUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ambassador Store',
          text: 'Check out my store link!',
          url: storeUrl,
        });
        return;
      } catch (error) {
      }
    }

    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
    }
  };

  return (
    <div style={{
      backgroundColor: '#121212',
      border: '1px solid #1F1F22',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        minWidth: 0
      }}>
        <span style={{
          fontSize: '11px',
          color: '#A1A1AA',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Ambassador Store Link
        </span>

        <div style={{
          backgroundColor: '#09090B',
          border: '1px solid #27272A',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: storeUrl ? '#E4E4E7' : '#71717A',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          userSelect: 'all',
          fontFamily: 'monospace'
        }}>
          {loading ? 'Loading link...' : (storeUrl || 'No store link assigned')}
        </div>
      </div>

      <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'flex-end' }}>
        <button
          onClick={handleShare}
          disabled={!storeUrl}
          title="Share or Copy Store Link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: storeUrl ? '#10B981' : '#27272A',
            color: storeUrl ? '#FFFFFF' : '#52525B',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: storeUrl ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            outline: 'none',
            height: '34px'
          }}
        >
          <ShareIcon width={15} height={15} stroke={storeUrl ? "#FFFFFF" : "#52525B"} />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>

        {copied && (
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '0',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: '600',
            padding: '3px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            Link Copied!
          </div>
        )}
      </div>
    </div>
  );
}
