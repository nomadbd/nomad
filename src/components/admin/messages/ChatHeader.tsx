import React from 'react';
import { BackIcon, GroupIcon } from '@/components/icons';
import * as styles from './AdminMessages.styles';

interface ChatHeaderProps {
  activeThread: any;
  headerTitle?: string;
  headerSubtitle?: string;
  onBack: () => void;
  openDrawer: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeThread,
  headerTitle,
  headerSubtitle,
  onBack,
  openDrawer,
}) => {
  const handleBackClick = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isFromAmbassador = params.get('from') === 'ambassadors' || params.get('from') === 'ambassador';

      if (isFromAmbassador) {
        // পেজ রিফ্রেশ না করে স্মুথলি ইউআরএল আপডেট ও পপ-স্টেট ট্রিগার করা
        const targetUrl = '/admin?tab=ambassadors';
        window.history.pushState({}, '', targetUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
        onBack();
        return;
      }
    }
    onBack();
  };

  const isGroupChat = activeThread?.id === 'all_staff';

  return (
    <div style={styles.whatsappHeaderStyle}>
      <button onClick={handleBackClick} style={styles.backBtnStyle} aria-label="Back">
        <BackIcon />
      </button>

      {/* AVATAR CONTAINER */}
      <div
        style={{
          ...styles.headerAvatarStyle,
          overflow: 'hidden',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}
        onClick={openDrawer}
      >
        {isGroupChat ? (
          /* গ্রুপ চ্যাট হলে GroupIcon দেখাবে */
          <GroupIcon size={18} color="#ffffff" />
        ) : activeThread?.avatarUrl ? (
          /* ইউজার চ্যাট হলে প্রোফাইল পিকচার */
          <img
            src={activeThread.avatarUrl}
            alt={headerTitle || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* প্রোফাইল পিকচার না থাকলে নামের প্রথম অক্ষর */
          headerTitle ? headerTitle.charAt(0).toUpperCase() : 'U'
        )}
      </div>

      <div style={styles.headerInfoStyle} onClick={openDrawer}>
        <span style={{ ...styles.headerNameTitle, color: '#ffffff' }}>{headerTitle}</span>
        {headerSubtitle && (
          <span style={{ ...styles.headerSubtitleStyle, color: '#bbbbbb' }}>{headerSubtitle}</span>
        )}
      </div>
    </div>
  );
};
