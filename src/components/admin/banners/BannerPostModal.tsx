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

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '9px',
  border: '1px solid #242429',
  backgroundColor: '#101013',
  color: '#f4f4f5',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
};

const getEmbedUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false`;
  }

  return null;
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
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [mediaFileUrl, setMediaFileUrl] = useState<string>('');
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | ''>('');
  const [externalVideoUrl, setExternalVideoUrl] = useState<string>('');
  const [showVideoInput, setShowVideoInput] = useState<boolean>(false);
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

  const embedSrc = getEmbedUrl(externalVideoUrl);

  const handleFileUpload = async (file: File) => {
    if (!CLOUD_NAME) {
      setErrorMsg('VITE_CLOUDINARY_CLOUD_NAME সেট করা নেই।');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const kind: 'image' | 'video' = isVideo ? 'video' : 'image';

    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${kind}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await res.json();
      if (!res.ok || !result.secure_url) {
        throw new Error(result?.error?.message || 'আপলোড ব্যর্থ হয়েছে।');
      }

      setMediaKind(kind);
      setMediaFileUrl(result.secure_url);
      setPublicId(result.public_id || '');
      setExternalVideoUrl('');
      setShowVideoInput(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'আপলোড সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setTitle('');
    setMediaFileUrl('');
    setMediaKind('');
    setExternalVideoUrl('');
    setShowVideoInput(false);
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

    const trimmedVideoLink = externalVideoUrl.trim();
    const resolvedVideoUrl =
      mediaKind === 'video' ? mediaFileUrl || null : trimmedVideoLink || null;
    const resolvedImageUrl = mediaKind === 'image' ? mediaFileUrl || null : null;
    const resolvedType = resolvedImageUrl ? 'image' : 'article';
    const resolvedMediaType = resolvedImageUrl
      ? 'image'
      : resolvedVideoUrl
      ? 'video'
      : 'text';

    const payload: Record<string, any> = {
      type: resolvedType,
      media_type: resolvedMediaType,
      title: title.trim() || content.trim().slice(0, 50) || 'Update',
      subtitle: null,
      article_body: content.trim() || null,
      image_url: resolvedImageUrl,
      video_url: resolvedVideoUrl,
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
        top: '56px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 90,
        backgroundColor: '#09090b',
        overflowY: 'auto',
        padding: '14px 12px 24px',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>
            Share a brand update
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#141417',
              border: '1px solid #27272a',
              color: '#f4f4f5',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '8px 11px',
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

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#0d0d10',
            border: '1px solid #222226',
            borderRadius: '12px',
            padding: '12px',
            display: 'grid',
            gap: '9px',
          }}
        >
          <textarea
            rows={4}
            placeholder="Share a brand update..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            style={{ ...fieldStyle, resize: 'vertical', minHeight: '92px' }}
          />

          <input
            type="text"
            placeholder="Headline (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={fieldStyle}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label
              style={{
                flex: 1,
                minWidth: '130px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px dashed #2b2b30',
                backgroundColor: '#111114',
                color: '#d4d4d8',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Photo / Video File
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                style={{ display: 'none' }}
              />
            </label>

            <button
              type="button"
              onClick={() => setShowVideoInput((v) => !v)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #27272a',
                backgroundColor: showVideoInput ? '#1d1d22' : '#111114',
                color: '#e4e4e7',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Video Link
            </button>
          </div>

          {showVideoInput && (
            <input
              type="url"
              placeholder="YouTube, Facebook or Vimeo link..."
              value={externalVideoUrl}
              onChange={(e) => {
                setExternalVideoUrl(e.target.value);
                setMediaFileUrl('');
                setMediaKind('');
              }}
              style={fieldStyle}
            />
          )}

          {uploading && (
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Uploading...</div>
          )}

          {mediaKind === 'image' && mediaFileUrl && (
            <div style={{ position: 'relative' }}>
              <img
                src={mediaFileUrl}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: '190px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  display: 'block',
                  border: '1px solid #222226',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setMediaFileUrl('');
                  setMediaKind('');
                }}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {mediaKind === 'video' && mediaFileUrl && (
            <video
              src={mediaFileUrl}
              controls
              style={{
                width: '100%',
                maxHeight: '200px',
                borderRadius: '8px',
                display: 'block',
                border: '1px solid #222226',
              }}
            />
          )}

          {!mediaFileUrl && embedSrc && (
            <iframe
              src={embedSrc}
              title="Video preview"
              allowFullScreen
              style={{
                width: '100%',
                height: '190px',
                border: '1px solid #222226',
                borderRadius: '8px',
                backgroundColor: '#000',
              }}
            />
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 0.65fr',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Link (optional)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={fieldStyle}
            />
            <input
              type="text"
              placeholder="Button (optional)"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              style={fieldStyle}
            />
            <input
              type="number"
              placeholder="Order"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              style={fieldStyle}
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
              <span style={{ fontSize: '10px', color: '#71717a' }}>Start</span>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...fieldStyle, fontSize: '11px', padding: '6px 8px' }}
              />
            </div>
            <div style={{ display: 'grid', gap: '3px' }}>
              <span style={{ fontSize: '10px', color: '#71717a' }}>End</span>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...fieldStyle, fontSize: '11px', padding: '6px 8px' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px',
              borderTop: '1px solid #1a1a1e',
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
            {saving ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};
