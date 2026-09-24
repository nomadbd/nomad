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
