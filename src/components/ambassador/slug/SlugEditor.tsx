import React from 'react';

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
  const storeUrl = `${window.location.origin}/ref/${slug}`;

  return (
    <section style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '24px', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '15px', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Custom Showcase Link</h3>

      {isEditingSlug ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>{window.location.origin}/ref/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="your-custom-slug"
            style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', flex: '1', minWidth: '180px' }}
          />
          <button
            onClick={handleSaveSlug}
            disabled={savingSlug}
            style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {savingSlug ? 'Saving...' : 'Save Link'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <a href={storeUrl} target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'underline', wordBreak: 'break-all', fontSize: '14px' }}>
            {storeUrl}
          </a>
          <button
            onClick={() => setIsEditingSlug(true)}
            style={{ backgroundColor: 'transparent', border: '1px solid #444', color: '#ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Edit Link
          </button>
        </div>
      )}

      {slugMsg.text && (
        <p style={{ marginTop: '10px', fontSize: '12px', color: slugMsg.type === 'error' ? '#ff4d4d' : '#00ff88', margin: '10px 0 0 0' }}>
          {slugMsg.text}
        </p>
      )}
    </section>
  );
}
