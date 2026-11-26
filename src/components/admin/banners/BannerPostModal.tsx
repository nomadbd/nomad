import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { BannerStyles } from '../../banners/BannerSlot';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET =
  (import.meta.env.VITE_CLOUDINARY_BANNER_PRESET as string) || 'banners_preset';

const INITIAL_STYLES: BannerStyles = {
  backgroundColor: '#18181b',
  titleColor: '#fafafa',
  textColor: '#a1a1aa',
  titleFontSize: '2.5rem',
  textFontSize: '1.1rem',
  buttonBg: '#fafafa',
  buttonColor: '#09090b',
  padding: '32px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  borderRadius: '8px',
  border: '1px solid #27272a',
  backgroundColor: '#111113',
  color: '#f4f4f5',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
};

interface BannerPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const BannerPostModal: React.FC<BannerPostModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [postKind, setPostKind] = useState<'text' | 'image' | 'video'>('text');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [publicId, setPublicId] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [ctaText, setCtaText] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [stylesForm, setStylesForm] = useState<BannerStyles>(INITIAL_STYLES);
  const [uploading, setUploading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleMediaUpload = async (file: File, kind: 'image' | 'video') => {
    if (!CLOUD_NAME) {
      setErrorMsg('VITE_CLOUDINARY_CLOUD_NAME সেট করা নেই।');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const endpoint = kind === 'video' ? 'video/upload' : 'image/upload';
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await res.json();
      if (!res.ok || !result.secure_url) {
        throw new Error(result?.error?.message || 'আপলোড ব্যর্থ হয়েছে।');
      }

      setMediaUrl(result.secure_url);
      setPublicId(result.public_id || '');
    } catch (err: any) {
      setErrorMsg(err.message || 'আপলোড সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setBodyText('');
    setMediaUrl('');
    setPublicId('');
    setLinkUrl('');
    setCtaText('');
    setSortOrder(0);
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    const dbType = postKind === 'text' ? 'article' : 'image';
    const payload: Record<string, any> = {
      type: dbType,
      media_type: postKind,
      title: title.trim() || 'Post',
      subtitle: subtitle.trim() || null,
      article_body: bodyText.trim() || null,
      image_url: postKind === 'image' ? mediaUrl.trim() || null : null,
      video_url: postKind === 'video' ? mediaUrl.trim() || null : null,
      public_id: publicId.trim() || null,
      link_url: linkUrl.trim() || null,
      cta_text: ctaText.trim() || null,
      slot_key: 'top_below_header',
      sort_order: Number(sortOrder) || 0,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      is_active: isActive,
      styles: stylesForm,
    };

    const { error } = await supabase.from('banners').insert([payload]);
    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    resetForm();
    onSaved();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0d0d10',
          border: '1px solid #222226',
          borderRadius: '12px',
          padding: '14px',
          color: '#f4f4f5',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600 }}>New Post</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#16161a',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '4px',
            padding: '3px',
            borderRadius: '9px',
            backgroundColor: '#141417',
            border: '1px solid #222226',
            marginBottom: '10px',
          }}
        >
          {(['text', 'image', 'video'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setPostKind(k);
                setMediaUrl('');
                setPublicId('');
              }}
              style={{
                padding: '6px 8px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: postKind === k ? '#fafafa' : 'transparent',
                color: postKind === k ? '#09090b' : '#a1a1aa',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              backgroundColor: '#1a0e0e',
              border: '1px solid #3f1d1d',
              color: '#f87171',
              fontSize: '12px',
              marginBottom: '10px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '8px' }}>
          <input
            type="text"
            placeholder="Title / Headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Subtitle / Caption"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            style={inputStyle}
          />

          <textarea
            rows={3}
            placeholder="Write post text..."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          {(postKind === 'image' || postKind === 'video') && (
            <div
              style={{
                border: '1px dashed #2a2a2f',
                borderRadius: '8px',
                padding: '8px 10px',
                backgroundColor: '#111114',
              }}
            >
              <input
                type="file"
                accept={postKind === 'video' ? 'video/*' : 'image/*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMediaUpload(file, postKind);
                }}
                style={{ fontSize: '12px', color: '#d4d4d8', width: '100%' }}
              />
              {uploading && (
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '5px' }}>
                  Uploading...
                </div>
              )}
              {mediaUrl && postKind === 'image' && (
                <img
                  src={mediaUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '160px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginTop: '8px',
                    display: 'block',
                  }}
                />
              )}
              {mediaUrl && postKind === 'video' && (
                <video
                  src={mediaUrl}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: '180px',
                    borderRadius: '8px',
                    marginTop: '8px',
                    display: 'block',
                  }}
                />
              )}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 0.7fr',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Link (opt)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="CTA Text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Order"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            <div style={{ display: 'grid', gap: '3px' }}>
              <span style={{ fontSize: '10px', color: '#71717a' }}>Start Time</span>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...inputStyle, fontSize: '11px', padding: '6px 8px' }}
              />
            </div>
            <div style={{ display: 'grid', gap: '3px' }}>
              <span style={{ fontSize: '10px', color: '#71717a' }}>End Time</span>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...inputStyle, fontSize: '11px', padding: '6px 8px' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px',
              borderTop: '1px solid #1b1b1f',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px', color: '#a1a1aa' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                BG
                <input
                  type="color"
                  value={stylesForm.backgroundColor || '#18181b'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, backgroundColor: e.target.value })
                  }
                  style={{ width: '18px', height: '18px', padding: 0, border: 'none', background: 'transparent' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                Title
                <input
                  type="color"
                  value={stylesForm.titleColor || '#fafafa'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, titleColor: e.target.value })
                  }
                  style={{ width: '18px', height: '18px', padding: 0, border: 'none', background: 'transparent' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                Text
                <input
                  type="color"
                  value={stylesForm.textColor || '#a1a1aa'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, textColor: e.target.value })
                  }
                  style={{ width: '18px', height: '18px', padding: 0, border: 'none', background: 'transparent' }}
                />
              </label>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: isActive ? '#fafafa' : '#71717a',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading || saving}
            style={{
              marginTop: '4px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#fafafa',
              color: '#09090b',
              fontWeight: 600,
              fontSize: '13px',
              cursor: uploading || saving ? 'not-allowed' : 'pointer',
              opacity: uploading || saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </form>
      </div>
    </div>
  );
};
