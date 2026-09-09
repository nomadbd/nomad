import React, { useState } from 'react';

interface StoreLinkBannerProps {
  slug: string;
}

export default function StoreLinkBanner({ slug }: StoreLinkBannerProps) {
  const [copied, setCopied] = useState(false);
  const storeUrl = `${window.location.origin}/ambassador/${slug || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)',
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div>
        <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#d4af37', fontWeight: 'bold' }}>YOUR STOREFRONT LINK</span>
        <div style={{ color: '#fff', fontSize: '14px', marginTop: '4px', wordBreak: 'break-all' }}>
          {storeUrl}
        </div>
      </div>
      <button
        onClick={handleCopy}
        style={{
          backgroundColor: copied ? '#10b981' : '#d4af37',
          color: '#000',
          fontWeight: '600',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {copied ? '✓ COPIED!' : 'COPY LINK'}
      </button>
    </div>
  );
}
