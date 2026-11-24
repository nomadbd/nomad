import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export interface BannerStyles {
  backgroundColor?: string;
  titleColor?: string;
  textColor?: string;
  titleFontSize?: string;
  textFontSize?: string;
  buttonBg?: string;
  buttonColor?: string;
  padding?: string;
}

export interface BannerItem {
  id: string;
  type: 'image' | 'article';
  title: string;
  subtitle?: string | null;
  article_body?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  cta_text?: string | null;
  slot_key: string;
  target_product_id?: string | null;
  sort_order: number;
  styles?: BannerStyles | null;
}

interface BannerSlotProps {
  slotKey: string;
  productId?: string;
  className?: string;
}

const DEFAULT_STYLES: BannerStyles = {
  backgroundColor: '#1a1a1a',
  titleColor: '#ffffff',
  textColor: '#cccccc',
  titleFontSize: '2.5rem',
  textFontSize: '1.1rem',
  buttonBg: '#ffffff',
  buttonColor: '#000000',
  padding: '32px',
};

const optimizeCloudinaryUrl = (url: string): string => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
};

export const BannerSlot: React.FC<BannerSlotProps> = ({
  slotKey,
  productId,
  className = '',
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const loadBanners = async () => {
      const nowIso = new Date().toISOString();

      let query = supabase
        .from('banners')
        .select('*')
        .eq('slot_key', slotKey)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${nowIso}`)
        .or(`end_date.is.null,end_date.gte.${nowIso}`)
        .order('sort_order', { ascending: true });

      if (productId) {
        query = query.eq('target_product_id', productId);
      }

      const { data, error } = await query;

      if (!isMounted || error || !data || data.length === 0) return;

      setBanners(data as BannerItem[]);
      setActiveIndex(Math.floor(Math.random() * data.length));
    };

    loadBanners();

    return () => {
      isMounted = false;
    };
  }, [slotKey, productId]);

  if (banners.length === 0) return null;

  const current = banners[activeIndex] || banners[0];
  const s = { ...DEFAULT_STYLES, ...(current.styles || {}) };
  const imgSrc = current.image_url ? optimizeCloudinaryUrl(current.image_url) : '';

  return (
    <section
      data-slot-key={slotKey}
      className={className}
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {current.type === 'image' && imgSrc ? (
        <div style={{ width: '100%', position: 'relative' }}>
          <img
            src={imgSrc}
            alt={current.title || 'Banner'}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '520px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: s.padding,
            }}
          >
            {current.title && (
              <h2
                style={{
                  color: s.titleColor,
                  fontSize: s.titleFontSize,
                  margin: 0,
                }}
              >
                {current.title}
              </h2>
            )}
            {current.subtitle && (
              <p
                style={{
                  color: s.textColor,
                  fontSize: s.textFontSize,
                  margin: '8px 0 0',
                }}
              >
                {current.subtitle}
              </p>
            )}
            {current.link_url && current.cta_text && (
              <a
                href={current.link_url}
                style={{
                  display: 'inline-block',
                  marginTop: '14px',
                  width: 'fit-content',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  backgroundColor: s.buttonBg,
                  color: s.buttonColor,
                }}
              >
                {current.cta_text}
              </a>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: s.backgroundColor,
            padding: s.padding,
            textAlign: 'center',
          }}
        >
          {current.title && (
            <h2
              style={{
                fontSize: s.titleFontSize,
                color: s.titleColor,
                marginBottom: '12px',
              }}
            >
              {current.title}
            </h2>
          )}
          {(current.article_body || current.subtitle) && (
            <p
              style={{
                fontSize: s.textFontSize,
                color: s.textColor,
                maxWidth: '720px',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {current.article_body || current.subtitle}
            </p>
          )}
          {current.link_url && current.cta_text && (
            <a
              href={current.link_url}
              style={{
                display: 'inline-block',
                marginTop: '18px',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                backgroundColor: s.buttonBg,
                color: s.buttonColor,
              }}
            >
              {current.cta_text}
            </a>
          )}
        </div>
      )}
    </section>
  );
};

export default BannerSlot;
