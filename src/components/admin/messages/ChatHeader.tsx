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
  return (
    <div style={styles.whatsappHeaderStyle}>
      <button onClick={onBack} style={styles.backBtnStyle} aria-label="Back">
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
