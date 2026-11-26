import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { BannerItem, BannerStyles } from '../../banners/BannerSlot';

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
  transition: 'border-color 0.15s ease',
};

export const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const [type, setType] = useState<'image' | 'article'>('image');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [articleBody, setArticleBody] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [publicId, setPublicId] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [ctaText, setCtaText] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [stylesForm, setStylesForm] = useState<BannerStyles>(INITIAL_STYLES);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBanners(data as BannerItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!CLOUD_NAME) {
      setStatusMsg('VITE_CLOUDINARY_CLOUD_NAME সেট করা নেই।');
      return;
    }

    setUploading(true);
    setStatusMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await res.json();
      if (!res.ok || !result.secure_url) {
        throw new Error(result?.error?.message || 'ছবি আপলোড ব্যর্থ হয়েছে।');
      }

      setImageUrl(result.secure_url);
      setPublicId(result.public_id || '');
      setStatusMsg('ছবি আপলোড হয়েছে।');
    } catch (err: any) {
      setStatusMsg(err.message || 'আপলোড সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');

    const payload = {
      type,
      title: title.trim() || 'Offer',
      subtitle: subtitle.trim() || null,
      article_body: articleBody.trim() || null,
      image_url: imageUrl.trim() || null,
      public_id: publicId.trim() || null,
      link_url: linkUrl.trim() || null,
      cta_text: ctaText.trim() || null,
      slot_key: 'top_below_header',
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
      styles: stylesForm,
    };

    const { error } = await supabase.from('banners').insert([payload]);

    if (error) {
      setStatusMsg(`সেভ করা যায়নি: ${error.message}`);
      return;
    }

    setTitle('');
    setSubtitle('');
    setArticleBody('');
    setImageUrl('');
    setPublicId('');
    setLinkUrl('');
    setCtaText('');
    setStatusMsg('সংরক্ষিত হয়েছে।');
    fetchBanners();
  };

  const toggleActive = async (item: BannerItem & { is_active?: boolean }) => {
    const nextState = !(item.is_active ?? true);
    await supabase
      .from('banners')
      .update({ is_active: nextState })
      .eq('id', item.id);
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from('banners').delete().eq('id', id);
    fetchBanners();
  };

  return (
    <div
      style={{
        padding: '16px 12px',
        color: '#f4f4f5',
        backgroundColor: '#09090b',
        minHeight: '100vh',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.04em',
              color: '#a1a1aa',
              backgroundColor: '#111113',
              border: '1px solid #27272a',
              padding: '3px 9px',
              borderRadius: '999px',
            }}
          >
            {banners.length} items
          </span>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: '#111814',
              border: '1px solid #1f3a29',
              color: '#4ade80',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            {statusMsg}
          </div>
        )}

        <form
          onSubmit={handleSaveBanner}
          style={{
            backgroundColor: '#0d0d10',
            border: '1px solid #222226',
            borderRadius: '12px',
            padding: '12px',
            display: 'grid',
            gap: '9px',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              padding: '3px',
              borderRadius: '9px',
              backgroundColor: '#141417',
              border: '1px solid #222226',
            }}
          >
            <button
              type="button"
              onClick={() => setType('image')}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: type === 'image' ? '#fafafa' : 'transparent',
                color: type === 'image' ? '#09090b' : '#a1a1aa',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Image Post
            </button>
            <button
              type="button"
              onClick={() => setType('article')}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: type === 'article' ? '#fafafa' : 'transparent',
                color: type === 'article' ? '#09090b' : '#a1a1aa',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Article Post
            </button>
          </div>

          <input
            type="text"
            placeholder="Headline / Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Short caption / subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            style={inputStyle}
          />

          {type === 'article' && (
            <textarea
              rows={3}
              placeholder="Announcement or offer details..."
              value={articleBody}
              onChange={(e) => setArticleBody(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          )}

          {type === 'image' && (
            <div
              style={{
                border: '1px dashed #2a2a2f',
                borderRadius: '8px',
                padding: '9px 10px',
                backgroundColor: '#111114',
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                style={{ fontSize: '12px', color: '#d4d4d8', width: '100%' }}
              />
              {uploading && (
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '5px' }}>
                  Uploading...
                </div>
              )}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginTop: '8px',
                    display: 'block',
                    border: '1px solid #222226',
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
              placeholder="Destination Link (opt)"
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
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
                  style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
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
                  style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
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
                  style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
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
              Live
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#fafafa',
              color: '#09090b',
              fontWeight: 600,
              fontSize: '13px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            Publish Item
          </button>
        </form>

        {loading ? (
          <p style={{ color: '#71717a', fontSize: '13px', textAlign: 'center', margin: '16px 0' }}>
            Loading...
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {banners.map((b: any) => (
              <article
                key={b.id}
                style={{
                  backgroundColor: '#0d0d10',
                  border: '1px solid #222226',
                  borderRadius: '11px',
                  padding: '11px 12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: b.is_active ? '#4ade80' : '#71717a',
                      }}
                    >
                      {b.is_active ? '● Live' : '○ Draft'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>
                    #{b.sort_order ?? 0}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '2px' }}>
                  {b.title}
                </div>

                {b.subtitle && (
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#a1a1aa', lineHeight: 1.45 }}>
                    {b.subtitle}
                  </p>
                )}

                {b.article_body && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#d4d4d8', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {b.article_body}
                  </p>
                )}

                {b.image_url && (
                  <img
                    src={b.image_url}
                    alt={b.title}
                    style={{
                      width: '100%',
                      maxHeight: '190px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #222226',
                      marginTop: '4px',
                      marginBottom: '8px',
                      display: 'block',
                    }}
                  />
                )}

                {(b.cta_text || b.link_url) && (
                  <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '8px' }}>
                    {b.cta_text && <span>{b.cta_text}</span>}
                    {b.cta_text && b.link_url && <span> · </span>}
                    {b.link_url && <span>{b.link_url}</span>}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '6px',
                    paddingTop: '8px',
                    borderTop: '1px solid #1a1a1e',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleActive(b)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #27272a',
                      backgroundColor: '#141417',
                      color: '#f4f4f5',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {b.is_active ? 'Hide' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBanner(b.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #3f1d1d',
                      backgroundColor: '#1a0e0e',
                      color: '#f87171',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManager;
