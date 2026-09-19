import React from 'react';
import { CloseIcon } from '@/components/icons';
import * as styles from './AdminMessages.styles';

interface NewChatModalProps {
  isAddOpen: boolean;
  onCloseAdd?: () => void;
  newChatSearch: string;
  setNewChatSearch: (val: string) => void;
  newChatUsers: any[];
  handleThreadClick: (user: any) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isAddOpen,
  onCloseAdd,
  newChatSearch,
  setNewChatSearch,
  newChatUsers,
  handleThreadClick,
}) => {
  if (!isAddOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      {/* প্রিমিয়াম স্টিকি হেডার */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0a0a0a',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '1px',
            color: '#ffffff',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}
        >
          START NEW CONVERSATION
        </span>
        <button
          onClick={onCloseAdd}
          style={{
            background: 'none',
            border: 'none',
            color: '#aaaaaa',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* প্রিমিয়াম ডিম্বাকার (Pill-shaped) সার্চ ইনপুট সেকশন */}
      <div
        style={{
          padding: '16px 20px 12px 20px',
          backgroundColor: '#0a0a0a',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="SEARCH USER, EMAIL OR PHONE..."
            value={newChatSearch}
            onChange={(e) => setNewChatSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '50px', // ডিম্বাকার বা পিল শেপ করার জন্য
              fontSize: '12px',
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box',
              letterSpacing: '0.5px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* ইউজার লিস্ট সেকশন (ফুল স্ক্রিন স্ক্রোলযোগ্য) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 20px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {newChatUsers.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50vh',
              color: '#666666',
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
            }}
          >
            NO USERS FOUND
          </div>
        ) : (
          newChatUsers.map((user) => {
            const name = user.userName || user.userEmail || 'User';
            return (
              <div
                key={user.id}
                onClick={() => handleThreadClick(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                {/* প্রোফাইল অ্যাভাটার */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ffffff',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* ইউজার ইনফো */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </div>
                  {user.userEmail && (
                    <div
                      style={{
                        color: '#777777',
                        fontSize: '11px',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.userEmail}
                    </div>
                  )}
                </div>

                {/* রোল ব্যাজ */}
                {user.role && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#aaaaaa',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {user.role}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
