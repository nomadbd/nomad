import React, { useState } from 'react';
import { ShareIcon } from '../../icons'; // src/components/icons থেকে সঠিকভাবে ইম্পোর্ট করা হলো

interface StoreLinkProps {
  profile: any;
  isAmbassadorActive?: boolean;
  customLink?: string;
}

export default function StoreLink({
  profile,
  isAmbassadorActive = false,
  customLink
}: StoreLinkProps) {
  const [copied, setCopied] = useState(false);

  // ডায়নামিক স্টোর/রেফারেল লিংক
  const storeUrl = customLink || 
    (isAmbassadorActive 
      ? `https://yourdomain.com/store/${profile?.referralCode || profile?.id || 'ref'}`
      : `https://yourdomain.com/store/${profile?.id || 'user'}`);

  const handleShare = async () => {
    // ১. মোবাইল বা সাপোর্টেড ব্রাউজারে Native Share Dialog
    if (navigator.share) {
      try {
        await navigator.share({
          title: isAmbassadorActive ? 'Ambassador Store' : 'My Store',
          text: 'Check out my store link!',
          url: storeUrl,
        });
        return;
      } catch (error) {
        console.log('Share canceled or fallback to copy clipboard');
      }
    }

    // ২. ফলব্যাক: ক্লিপবোর্ড কপি
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
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
      {/* বামপাশে: লিংক লেবেল এবং টেক্সট বক্স */}
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
          {storeUrl}
        </div>
      </div>

      {/* ডানপাশে: শেয়ার বাটন */}
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

        {/* কপির পপআপ ফিডব্যাক */}
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
