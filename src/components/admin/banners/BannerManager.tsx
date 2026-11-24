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
  const [slotKey, setSlotKey] = useState<string>('home_top');
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
      slot_key: slotKey.trim() || 'custom_slot',
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
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#0c0c0c' }}>
      <h2 style={{ marginTop: 0 }}>Banner & Offer Manager</h2>
      {statusMsg && <p style={{ color: '#4ade80' }}>{statusMsg}</p>}

      <form
        onSubmit={handleSaveBanner}
        style={{
          display: 'grid',
          gap: '12px',
          maxWidth: '680px',
          marginBottom: '28px',
        }}
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'image' | 'article')}
        >
          <option value="image">Image Banner</option>
          <option value="article">Article / Text Offer</option>
        </select>

        <input
          type="text"
          placeholder="Slot Key (যেমন: home_hero, product_below, footer_offer)"
          value={slotKey}
          onChange={(e) => setSlotKey(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Target Product ID (ঐচ্ছিক - নির্দিষ্ট প্রোডাক্টের নিচে দেখাতে)"
          value={targetProductId}
          onChange={(e) => setTargetProductId(e.target.value)}
        />

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        {type === 'article' && (
          <textarea
            rows={4}
            placeholder="Article / Offer details"
            value={articleBody}
            onChange={(e) => setArticleBody(e.target.value)}
          />
        )}

        {type === 'image' && (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            {uploading && <span> Uploading...</span>}
            {imageUrl && (
              <div style={{ marginTop: '8px' }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ maxHeight: '120px', borderRadius: '6px' }}
                />
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Link URL (ঐচ্ছিক)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />

        <input
          type="text"
          placeholder="Button Text (যেমন: Shop Now)"
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
        />

        <input
          type="number"
          placeholder="Sort Order"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />

        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />{' '}
          Active
        </label>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label>
            BG:{' '}
            <input
              type="color"
              value={stylesForm.backgroundColor || '#1a1a1a'}
              onChange={(e) =>
                setStylesForm({ ...stylesForm, backgroundColor: e.target.value })
              }
            />
          </label>
          <label>
            Title:{' '}
            <input
              type="color"
              value={stylesForm.titleColor || '#ffffff'}
              onChange={(e) =>
                setStylesForm({ ...stylesForm, titleColor: e.target.value })
              }
            />
          </label>
          <label>
            Text:{' '}
            <input
              type="color"
              value={stylesForm.textColor || '#cccccc'}
              onChange={(e) =>
                setStylesForm({ ...stylesForm, textColor: e.target.value })
              }
            />
          </label>
        </div>

        <button type="submit" disabled={uploading}>
          Save Banner
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {banners.map((b: any) => (
            <div
              key={b.id}
              style={{
                border: '1px solid #2a2a2a',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <strong>{b.title}</strong> — Slot: <code>{b.slot_key}</code>
                {b.target_product_id && (
                  <>
                    {' '}
                    | Product: <code>{b.target_product_id}</code>
                  </>
                )}
                <div>Status: {b.is_active ? 'Active' : 'Inactive'}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => toggleActive(b)}>
                  {b.is_active ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onClick={() => deleteBanner(b.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerManager;
