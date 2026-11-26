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
  minWidth: 0,
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #232328',
  backgroundColor: '#101013',
  color: '#f4f4f5',
  fontSize: '12px',
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
  const [showVideoLink, setShowVideoLink] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [showStyle, setShowStyle] = useState<boolean>(false);
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
      setShowVideoLink(false);
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
    setShowVideoLink(false);
    setShowSchedule(false);
    setShowStyle(false);
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

  const chipBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 9px',
    borderRadius: '7px',
    border: '1px solid #25252b',
    backgroundColor: active ? '#1e1e24' : '#111114',
    color: active ? '#fafafa' : '#a1a1aa',
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

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
        overflowX: 'hidden',
        padding: '10px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: '540px', margin: '0 auto', minWidth: 0 }}>
        {errorMsg && (
          <div
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              backgroundColor: '#1a0e0e',
              border: '1px solid #3f1d1d',
              color: '#f87171',
              fontSize: '11px',
              marginBottom: '8px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: '8px',
            width: '100%',
            minWidth: 0,
          }}
        >
          <textarea
            rows={4}
            placeholder="Share a brand update"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ ...fieldStyle, resize: 'vertical', minHeight: '88px' }}
          />

          <input
            type="text"
            placeholder="Headline (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={fieldStyle}
          />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={chipBtnStyle(false)}>
              Media
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
              onClick={() => setShowVideoLink((v) => !v)}
              style={chipBtnStyle(showVideoLink)}
            >
              Video URL
            </button>
            <button
              type="button"
              onClick={() => setShowSchedule((v) => !v)}
              style={chipBtnStyle(showSchedule)}
            >
              Time
            </button>
            <button
              type="button"
              onClick={() => setShowStyle((v) => !v)}
              style={chipBtnStyle(showStyle)}
            >
              Style
            </button>
            <label
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: isActive ? '#fafafa' : '#71717a',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Live
            </label>
          </div>

          {showVideoLink && (
            <input
              type="url"
              placeholder="YouTube, Facebook, Vimeo URL"
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
                  maxHeight: '170px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  display: 'block',
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
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '10px',
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
                maxHeight: '180px',
                borderRadius: '8px',
                display: 'block',
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
                height: '175px',
                border: '1px solid #232328',
                borderRadius: '8px',
                backgroundColor: '#000',
              }}
            />
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 64px',
              gap: '6px',
              width: '100%',
            }}
          >
            <input
              type="text"
              placeholder="Link (opt)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={fieldStyle}
            />
            <input
              type="text"
              placeholder="Button (opt)"
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

          {showSchedule && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '6px',
                width: '100%',
              }}
            >
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...fieldStyle, fontSize: '11px', padding: '6px 8px' }}
              />
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...fieldStyle, fontSize: '11px', padding: '6px 8px' }}
              />
            </div>
          )}

          {showStyle && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                fontSize: '11px',
                color: '#a1a1aa',
                padding: '6px 8px',
                borderRadius: '8px',
                backgroundColor: '#101013',
                border: '1px solid #232328',
              }}
            >
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
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #27272a',
                backgroundColor: '#111114',
                color: '#a1a1aa',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || saving}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#fafafa',
                color: '#09090b',
                fontWeight: 600,
                fontSize: '12px',
                cursor: uploading || saving ? 'not-allowed' : 'pointer',
                opacity: uploading || saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
