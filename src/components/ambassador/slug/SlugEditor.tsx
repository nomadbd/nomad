import React, { useState } from 'react';
import { isReservedSlug } from '@/reservedSlugs';

interface SlugEditorProps {
  slug: string;
  setSlug: (val: string) => void;
  isEditingSlug: boolean;
  setIsEditingSlug: (val: boolean) => void;
  handleSaveSlug: () => void;
  savingSlug: boolean;
  slugMsg: { type: string; text: string };
}

export default function SlugEditor({
  slug,
  setSlug,
  isEditingSlug,
  setIsEditingSlug,
  handleSaveSlug,
  savingSlug,
  slugMsg
}: SlugEditorProps) {
  const [localError, setLocalError] = useState('');
  const storeUrl = `${window.location.origin}/${slug}`;

  const onSave = () => {
    setLocalError('');
    const cleanSlug = slug.trim().toLowerCase();

    if (!cleanSlug) {
      setLocalError('Slug name cannot be empty.');
      return;
    }

    if (isReservedSlug(cleanSlug)) {
      setLocalError('This name is reserved by system. Please choose another.');
      return;
    }

    handleSaveSlug();
  };

  return (
    <section style={cardContainerStyle}>
      <div style={headerStyle}>
        <span style={labelBadgeStyle}>STORE LINK</span>
        <h3 style={titleStyle}>Custom Showcase Link</h3>
      </div>

      {isEditingSlug ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={inputGroupStyle}>
            <span style={domainPrefixStyle}>{window.location.origin}/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setLocalError('');
              }}
              placeholder="your-custom-slug"
              style={inputStyle}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsEditingSlug(false)}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={savingSlug}
              style={saveButtonStyle}
            >
              {savingSlug ? 'Saving...' : 'Save Link'}
            </button>
          </div>
        </div>
      ) : (
        <div style={linkRowStyle}>
          <a 
            href={storeUrl} 
            target="_blank" 
            rel="noreferrer" 
            style={linkStyle}
          >
            {storeUrl}
          </a>
          <button
            onClick={() => setIsEditingSlug(true)}
            style={editButtonStyle}
          >
            Edit Link
          </button>
        </div>
      )}

      {(localError || slugMsg.text) && (
        <div style={messageBannerStyle(localError || slugMsg.type === 'error')}>
          {localError || slugMsg.text}
        </div>
      )}
    </section>
  );
}

// ---------------- STYLES ----------------

const cardContainerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(18, 18, 18, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '20px',
  padding: '24px',
  marginBottom: '24px',
  backdropFilter: 'blur(20px)',
  boxSizing: 'border-box',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelBadgeStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: '#86868b',
  display: 'block',
  marginBottom: '4px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  margin: 0,
  color: '#ffffff',
  letterSpacing: '-0.01em',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  padding: '4px 12px',
  overflow: 'hidden',
};

const domainPrefixStyle: React.CSSProperties = {
  color: '#86868b',
  fontSize: '13px',
  userSelect: 'none',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#ffffff',
  padding: '10px 4px',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  fontWeight: 500,
};

const saveButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  padding: '10px 18px',
  borderRadius: '10px',
  fontWeight: 600,
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'opacity 0.2s ease',
};

const cancelButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#86868b',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '12px',
  cursor: 'pointer',
};

const linkRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '12px 16px',
  borderRadius: '12px',
  flexWrap: 'wrap',
};

const linkStyle: React.CSSProperties = {
  color: '#2997ff',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 500,
  wordBreak: 'break-all',
};

const editButtonStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  padding: '6px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 500,
};

const messageBannerStyle = (isError: boolean): React.CSSProperties => ({
  marginTop: '12px',
  fontSize: '12px',
  fontWeight: 500,
  color: isError ? '#ef4444' : '#22c55e',
  backgroundColor: isError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
  border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
  padding: '8px 12px',
  borderRadius: '8px',
});
