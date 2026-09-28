import React, { useState, useEffect } from 'react';
import { ShareIcon } from '../../icons';

interface StoreLinkProps {
  profile?: any;
  ambassadorData?: any;
  isAmbassadorActive?: boolean;
  customLink?: string;
}

export default function StoreLink({
  profile,
  ambassadorData,
  isAmbassadorActive = false,
  customLink
}: StoreLinkProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const rawSlug = 
    ambassadorData?.assigned_slug || 
    ambassadorData?.token || 
    ambassadorData?.slug || 
    profile?.assigned_slug || 
    profile?.slug || 
    '';

  const slug = typeof rawSlug === 'string' ? rawSlug.trim().replace(/^\/+|\/+$/g, '') : '';
  const cleanOrigin = origin ? origin.replace(/\/+$/, '') : '';

  const storeUrl = customLink || (cleanOrigin && slug ? `${cleanOrigin}/${slug}` : cleanOrigin);

  const handleShare = async () => {
    if (!storeUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isAmbassadorActive ? 'Ambassador Store' : 'My Store',
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
          {isAmbassadorActive ? 'Ambassador Store Link' : 'Store Link'}
        </span>

        <div style={{
          backgroundColor: '#09090B',
          border: '1px solid #27272A',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#E4E4E7',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          userSelect: 'all',
          fontFamily: 'monospace'
        }}>
          {storeUrl || 'Loading...'}
        </div>
      </div>

      <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'flex-end' }}>
        <button
          onClick={handleShare}
          title="Share or Copy Store Link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: isAmbassadorActive ? '#10B981' : '#27272A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            height: '34px'
          }}
        >
          <ShareIcon width={15} height={15} stroke="#FFFFFF" />
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
