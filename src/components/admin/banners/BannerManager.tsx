import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { BannerItem, BannerStyles } from '../../banners/BannerSlot';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET =
  (import.meta.env.VITE_CLOUDINARY_BANNER_PRESET as string) || 'banners_preset';

const INITIAL_STYLES: BannerStyles = {
  backgroundColor: '#1a1a1a',
  titleColor: '#ffffff',
  textColor: '#cccccc',
  titleFontSize: '2.5rem',
  textFontSize: '1.1rem',
  buttonBg: '#ffffff',
  buttonColor: '#000000',
  padding: '32px',
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #262626',
  backgroundColor: '#141414',
  color: '#f5f5f5',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
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
  const [slotKey, setSlotKey] = useState<string>('products_top');
  const [targetProductId, setTargetProductId] = useState<string>('');
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
      setStatusMsg('ছবি Cloudinary-তে আপলোড হয়েছে।');
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
      slot_key: slotKey.trim() || 'products_top',
      target_product_id: targetProductId.trim() || null,
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
    setTargetProductId('');
    setStatusMsg('ব্যানার/অফার সংরক্ষিত হয়েছে।');
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
        padding: '24px 16px',
        color: '#f5f5f5',
        backgroundColor: '#000000',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '620px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '14px',
            marginBottom: '18px',
            borderBottom: '1px solid #1f1f1f',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Banner & Offer Feed
          </h2>
          <span style={{ fontSize: '12px', color: '#888' }}>
            {banners.length} posts
          </span>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#111814',
              border: '1px solid #1f3a29',
              color: '#4ade80',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {statusMsg}
          </div>
        )}

        <form
          onSubmit={handleSaveBanner}
          style={{
            backgroundColor: '#0b0b0b',
            border: '1px solid #1f1f1f',
            borderRadius: '14px',
            padding: '16px',
            display: 'grid',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setType('image')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid #262626',
                backgroundColor: type === 'image' ? '#ffffff' : '#141414',
                color: type === 'image' ? '#000000' : '#a3a3a3',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Image Post
            </button>
            <button
              type="button"
              onClick={() => setType('article')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '999px',
                border: '1px solid #262626',
                backgroundColor: type === 'article' ? '#ffffff' : '#141414',
                color: type === 'article' ? '#000000' : '#a3a3a3',
                fontWeight: 600,
                fontSize: '13px',
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
            style={fieldStyle}
          />

          <input
            type="text"
            placeholder="Short caption / subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            style={fieldStyle}
          />

          {type === 'article' && (
            <textarea
              rows={4}
              placeholder="Write your announcement or offer details..."
              value={articleBody}
              onChange={(e) => setArticleBody(e.target.value)}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          )}

          {type === 'image' && (
            <div
              style={{
                border: '1px dashed #2b2b2b',
                borderRadius: '10px',
                padding: '12px',
                backgroundColor: '#101010',
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                style={{ fontSize: '13px', color: '#ccc' }}
              />
              {uploading && (
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                  Uploading media...
                </div>
              )}
              {imageUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: '260px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      display: 'block',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px',
            }}
          >
            <input
              type="text"
              placeholder="Slot Key (e.g. products_top)"
              value={slotKey}
              onChange={(e) => setSlotKey(e.target.value)}
              required
              style={fieldStyle}
            />
            <input
              type="text"
              placeholder="Target Product ID (optional)"
              value={targetProductId}
              onChange={(e) => setTargetProductId(e.target.value)}
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px',
            }}
          >
            <input
              type="text"
              placeholder="Destination Link (optional)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={fieldStyle}
            />
            <input
              type="text"
              placeholder="CTA Button Text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '6px',
              borderTop: '1px solid #1a1a1a',
            }}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '12px', color: '#aaa' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                BG
                <input
                  type="color"
                  value={stylesForm.backgroundColor || '#1a1a1a'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, backgroundColor: e.target.value })
                  }
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                Title
                <input
                  type="color"
                  value={stylesForm.titleColor || '#ffffff'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, titleColor: e.target.value })
                  }
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                Text
                <input
                  type="color"
                  value={stylesForm.textColor || '#cccccc'}
                  onChange={(e) =>
                    setStylesForm({ ...stylesForm, textColor: e.target.value })
                  }
                />
              </label>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: isActive ? '#ffffff' : '#777',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Publish live
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: '11px 16px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontWeight: 600,
              fontSize: '14px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            Post Banner
          </button>
        </form>

        {loading ? (
          <p style={{ color: '#888', fontSize: '14px', textAlign: 'center' }}>
            Loading posts...
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {banners.map((b: any) => (
              <article
                key={b.id}
                style={{
                  backgroundColor: '#0b0b0b',
                  border: '1px solid #1f1f1f',
                  borderRadius: '14px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: '999px',
                        backgroundColor: '#171717',
                        color: '#e5e5e5',
                        border: '1px solid #262626',
                      }}
                    >
                      {b.slot_key}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: b.is_active ? '#4ade80' : '#9ca3af',
                      }}
                    >
                      {b.is_active ? '● Live' : '○ Draft'}
                    </span>
                    {b.target_product_id && (
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        #{b.target_product_id}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    #{b.sort_order ?? 0}
                  </span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                  {b.title}
                </div>

                {b.subtitle && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#b3b3b3', lineHeight: 1.5 }}>
                    {b.subtitle}
                  </p>
                )}

                {b.article_body && (
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#d4d4d4', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                    {b.article_body}
                  </p>
                )}

                {b.image_url && (
                  <img
                    src={b.image_url}
                    alt={b.title}
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '1px solid #1e1e1e',
                      marginTop: '6px',
                      marginBottom: '10px',
                      display: 'block',
                    }}
                  />
                )}

                {(b.cta_text || b.link_url) && (
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                    {b.cta_text && <span>CTA: {b.cta_text}</span>}
                    {b.cta_text && b.link_url && <span> · </span>}
                    {b.link_url && <span>{b.link_url}</span>}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #181818',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleActive(b)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: '1px solid #2a2a2a',
                      backgroundColor: '#141414',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {b.is_active ? 'Hide' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBanner(b.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: '1px solid #3a1d1d',
                      backgroundColor: '#190d0d',
                      color: '#f87171',
                      fontSize: '12px',
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
