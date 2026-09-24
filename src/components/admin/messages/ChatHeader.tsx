import React from 'react';
import { BackIcon } from '@/components/icons';
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
  // ব্যাক বাটনে ক্লিক করলে URL চেক করবে ইউজার Ambassador ট্যাব থেকে এসেছে কি না
  const handleBackClick = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isFromAmbassador = params.get('from') === 'ambassador';

      if (isFromAmbassador) {
        // Ambassador ট্যাবে স্মুথলি ফেরত নিয়ে যাওয়া
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', 'ambassador');
        newUrl.searchParams.delete('from');
        newUrl.searchParams.delete('userId');
        newUrl.searchParams.delete('search');
        
        window.history.pushState({}, '', newUrl.toString());
        window.dispatchEvent(new Event('popstate')); // Tab State আপডেট করার জন্য
        onBack();
        return;
      }
    }
    // স্বাভাবিকভাবে মেসেজ লিস্টে ব্যাক করবে
    onBack();
  };

  return (
    <div style={styles.whatsappHeaderStyle}>
      <button onClick={handleBackClick} style={styles.backBtnStyle} aria-label="Back">
        <BackIcon />
      </button>

      <div
        style={{ ...styles.headerAvatarStyle, overflow: 'hidden', padding: 0 }}
        onClick={openDrawer}
      >
        {activeThread?.avatarUrl ? (
          <img
            src={activeThread.avatarUrl}
            alt={headerTitle || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
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
