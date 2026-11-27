import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { BannerStyles } from './BannerSlot';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET =
  (import.meta.env.VITE_CLOUDINARY_BANNER_PRESET as string) || 'banners_preset';

const INITIAL_STYLES: BannerStyles = {
  backgroundColor: '#18181b',
  titleColor: '#fafafa',
  textColor: '#a1a1aa',
  titleFontSize: '1.5rem',
  textFontSize: '0.95rem',
  buttonBg: '#fafafa',
  buttonColor: '#09090b',
  padding: '24px',
};

const underlineFieldStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '8px 2px',
  border: 'none',
  borderBottom: '1px solid #26262c',
  borderRadius: 0,
  backgroundColor: 'transparent',
  color: '#f4f4f5',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const compactFieldStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '8px 10px',
  borderRadius: '9px',
  border: '1px solid #232329',
  backgroundColor: '#101014',
  color: '#f4f4f5',
  fontSize: '12px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
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
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mediaFileUrl, setMediaFileUrl] = useState<string>('');
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | ''>('');
  const [externalVideoUrl, setExternalVideoUrl] = useState<string>('');
  const [showVideoLink, setShowVideoLink] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [showStyle, setShowStyle] = useState<boolean>(false);
  const [showCta, setShowCta] = useState<boolean>(false);
  const [publicId, setPublicId] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [ctaText, setCtaText] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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
    setTitle('');
    setContent('');
    setMediaFileUrl('');
    setMediaKind('');
    setExternalVideoUrl('');
    setShowVideoLink(false);
    setShowSchedule(false);
    setShowStyle(false);
    setShowCta(false);
    setPublicId('');
    setLinkUrl('');
    setCtaText('');
    setStartDate('');
    setEndDate('');
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
      sort_order: null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      is_active: true,
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
    flexShrink: 0,
    padding: '6px 11px',
    borderRadius: '8px',
    border: active ? '1px solid #3f3f46' : '1px solid #222228',
    backgroundColor: active ? '#1c1c22' : '#101014',
    color: active ? '#fafafa' : '#a1a1aa',
    fontSize: '11.5px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.18s ease',
  });

  const drawerStyle = (open: boolean, maxH: number): React.CSSProperties => ({
    maxHeight: open ? `${maxH}px` : '0px',
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : 'translateY(-4px)',
    overflow: 'hidden',
    transition: 'max-height 0.28s ease, opacity 0.22s ease, transform 0.22s ease',
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
        padding: '12px',
        boxSizing: 'border-box',
        animation: 'composerFadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes composerFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .underline-input:focus {
          border-bottom-color: #71717a !important;
        }
        .compact-input:focus {
          border-color: #3f3f46 !important;
          background-color: #131318 !important;
        }
        .action-strip::-webkit-scrollbar {
          display: none;
        }
        .composer-color {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          padding: 0;
          border: 1px solid #2c2c34;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
        }
        .composer-color::-webkit-color-swatch-wrapper {
          padding: 1px;
        }
        .composer-color::-webkit-color-swatch {
          border: none;
          border-radius: 4px;
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: '540px', margin: '0 auto', minWidth: 0 }}>
        {errorMsg && (
          <div
            style={{
              padding: '8px 11px',
              borderRadius: '9px',
              backgroundColor: '#1a0e0e',
              border: '1px solid #3f1d1d',
              color: '#f87171',
              fontSize: '11.5px',
              marginBottom: '10px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#0c0c0f',
            border: '1px solid #1e1e24',
            borderRadius: '14px',
            padding: '14px 12px',
            display: 'grid',
            gap: '10px',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <input
            type="text"
            placeholder="Headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="underline-input"
            style={{
              ...underlineFieldStyle,
              fontSize: '14px',
              fontWeight: 500,
            }}
          />

          <textarea
            rows={3}
            placeholder="Share a brand update"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="underline-input"
            style={{
              ...underlineFieldStyle,
              resize: 'none',
              minHeight: '76px',
              lineHeight: 1.5,
            }}
          />

          <div
            className="action-strip"
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '2px 0',
              width: '100%',
            }}
          >
            <label style={chipBtnStyle(Boolean(mediaFileUrl))}>
              {mediaFileUrl ? 'Media ✓' : 'Media'}
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
              style={chipBtnStyle(showVideoLink || Boolean(externalVideoUrl))}
            >
              Video URL
            </button>

            <button
              type="button"
              onClick={() => setShowSchedule((v) => !v)}
              style={chipBtnStyle(showSchedule || Boolean(startDate || endDate))}
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

            <button
              type="button"
              onClick={() => setShowCta((v) => !v)}
              style={chipBtnStyle(showCta || Boolean(linkUrl || ctaText))}
            >
              Link & Button
            </button>
          </div>

          <div style={drawerStyle(showVideoLink, 64)}>
            <div style={{ paddingTop: '2px' }}>
              <input
                type="url"
                placeholder="YouTube, Facebook, Vimeo URL"
                value={externalVideoUrl}
                onChange={(e) => {
                  setExternalVideoUrl(e.target.value);
                  setMediaFileUrl('');
                  setMediaKind('');
                }}
                className="compact-input"
                style={compactFieldStyle}
              />
            </div>
          </div>

          <div style={drawerStyle(showSchedule, 72)}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '7px',
                width: '100%',
                paddingTop: '2px',
              }}
            >
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="compact-input"
                style={{ ...compactFieldStyle, fontSize: '11px', padding: '7px 8px' }}
              />
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="compact-input"
                style={{ ...compactFieldStyle, fontSize: '11px', padding: '7px 8px' }}
              />
            </div>
          </div>

          <div style={drawerStyle(showStyle, 68)}>
            <div
              style={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
                alignItems: 'center',
                fontSize: '11.5px',
                color: '#a1a1aa',
                padding: '8px 10px',
                marginTop: '2px',
                borderRadius: '10px',
                backgroundColor: '#101014',
                border: '1px solid #222228',
              }}
            >
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                BG
                <input
                  type="color"
                  value={stylesForm.backgroundColor || '#18181b'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, backgroundColor: e.target.value })
                  }
                  className="composer-color"
                />
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                Title
                <input
                  type="color"
                  value={stylesForm.titleColor || '#fafafa'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, titleColor: e.target.value })
                  }
                  className="composer-color"
                />
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                Text
                <input
                  type="color"
                  value={stylesForm.textColor || '#a1a1aa'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, textColor: e.target.value })
                  }
                  className="composer-color"
                />
              </label>
            </div>
          </div>

          <div style={drawerStyle(showCta, 68)}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '7px',
                width: '100%',
                paddingTop: '2px',
              }}
            >
              <input
                type="text"
                placeholder="Link (optional)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="compact-input"
                style={compactFieldStyle}
              />
              <input
                type="text"
                placeholder="Button (optional)"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="compact-input"
                style={compactFieldStyle}
              />
            </div>
          </div>

          {uploading && (
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Uploading media...</div>
          )}

          {mediaKind === 'image' && mediaFileUrl && (
            <div style={{ position: 'relative' }}>
              <img
                src={mediaFileUrl}
                alt="Preview"
                style={{
                  width: '100%',
                  maxHeight: '175px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  display: 'block',
                  border: '1px solid #222228',
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
                  top: '7px',
                  right: '7px',
                  background: 'rgba(9, 9, 11, 0.78)',
                  color: '#f4f4f5',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '7px',
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
                maxHeight: '185px',
                borderRadius: '10px',
                display: 'block',
                border: '1px solid #222228',
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
                height: '180px',
                border: '1px solid #222228',
                borderRadius: '10px',
                backgroundColor: '#000',
              }}
            />
          )}

          <div style={{ display: 'flex', gap: '8px', paddingTop: '2px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #24242a',
                backgroundColor: '#101014',
                color: '#a1a1aa',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || saving}
              style={{
                flex: 1,
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#fafafa',
                color: '#09090b',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: uploading || saving ? 'not-allowed' : 'pointer',
                opacity: uploading || saving ? 0.6 : 1,
                transition: 'opacity 0.18s ease, transform 0.12s ease',
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
