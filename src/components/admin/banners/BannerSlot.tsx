import React, { useState, useEffect, useRef } from 'react';
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
  media_type?: 'text' | 'image' | 'video' | null;
  title: string;
  subtitle?: string | null;
  article_body?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  link_url?: string | null;
  cta_text?: string | null;
  slot_key: string;
  target_product_id?: string | null;
  sort_order: number;
  start_date?: string | null;
  end_date?: string | null;
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
  titleFontSize: '1.5rem',
  textFontSize: '0.95rem',
  buttonBg: '#ffffff',
  buttonColor: '#000000',
  padding: '24px',
};

const optimizeCloudinaryUrl = (url: string): string => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
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

const arrangeBanners = (items: BannerItem[]): BannerItem[] => {
  if (items.length <= 1) return items;

  const pinnedFirst = items.filter((item) => Number(item.sort_order) === 1);
  const randomPool = items.filter((item) => Number(item.sort_order) !== 1);

  for (let i = randomPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomPool[i], randomPool[j]] = [randomPool[j], randomPool[i]];
  }

  return [...pinnedFirst, ...randomPool];
};

export const BannerSlot: React.FC<BannerSlotProps> = ({
  slotKey,
  productId,
  className = '',
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBanners = async () => {
      let query = supabase
        .from('banners')
        .select('*')
        .eq('slot_key', slotKey)
        .eq('is_active', true);

      if (productId) {
        query = query.eq('target_product_id', productId);
      }

      const { data, error } = await query;

      if (!isMounted || error || !data || data.length === 0) return;

      const now = Date.now();
      const validItems = (data as BannerItem[]).filter((item) => {
        if (item.start_date) {
          const start = new Date(item.start_date).getTime();
          if (!Number.isNaN(start) && start > now) return false;
        }
        if (item.end_date) {
          const end = new Date(item.end_date).getTime();
          if (!Number.isNaN(end) && end < now) return false;
        }
        return true;
      });

      if (validItems.length === 0) return;

      setBanners(arrangeBanners(validItems));
      setActiveIndex(0);
    };

    loadBanners();

    return () => {
      isMounted = false;
    };
  }, [slotKey, productId]);

  if (banners.length === 0) return null;

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  return (
    <section
      data-slot-key={slotKey}
      className={className}
      style={{
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .banner-slot-track::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="banner-slot-track"
        style={{
          display: 'flex',
          width: '100%',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {banners.map((item) => {
          const s = { ...DEFAULT_STYLES, ...(item.styles || {}) };
          const imgSrc = item.image_url ? optimizeCloudinaryUrl(item.image_url) : '';
          const embedSrc = item.video_url ? getEmbedUrl(item.video_url) : null;
          const bodyText = item.article_body || item.subtitle || '';
          const showSeparateTitle =
            Boolean(item.title) &&
            (!bodyText || (bodyText !== item.title && !bodyText.startsWith(item.title)));

          return (
            <div
              key={item.id}
              style={{
                flex: '0 0 100%',
                width: '100%',
                scrollSnapAlign: 'start',
                boxSizing: 'border-box',
              }}
            >
              {item.video_url ? (
                <div
                  style={{
                    width: '100%',
                    backgroundColor: s.backgroundColor,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {embedSrc ? (
                    <iframe
                      src={embedSrc}
                      title={item.title || 'Video'}
                      allowFullScreen
                      style={{
                        width: '100%',
                        height: '280px',
                        border: 'none',
                        display: 'block',
                        backgroundColor: '#000',
                      }}
                    />
                  ) : (
                    <video
                      src={item.video_url}
                      controls
                      playsInline
                      style={{
                        width: '100%',
                        maxHeight: '420px',
                        display: 'block',
                        backgroundColor: '#000',
                      }}
                    />
                  )}
                  {(showSeparateTitle || bodyText || (item.link_url && item.cta_text)) && (
                    <div style={{ padding: '16px 20px' }}>
                      {showSeparateTitle && (
                        <h2
                          style={{
                            color: s.titleColor,
                            fontSize: s.titleFontSize,
                            margin: 0,
                          }}
                        >
                          {item.title}
                        </h2>
                      )}
                      {bodyText && (
                        <p
                          style={{
                            color: s.textColor,
                            fontSize: s.textFontSize,
                            margin: showSeparateTitle ? '6px 0 0' : 0,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {bodyText}
                        </p>
                      )}
                      {item.link_url && item.cta_text && (
                        <a
                          href={item.link_url}
                          style={{
                            display: 'inline-block',
                            marginTop: '12px',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            backgroundColor: s.buttonBg,
                            color: s.buttonColor,
                          }}
                        >
                          {item.cta_text}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : imgSrc ? (
                <div style={{ width: '100%', position: 'relative' }}>
                  <img
                    src={imgSrc}
                    alt={item.title || 'Banner'}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '480px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {(showSeparateTitle || bodyText || (item.link_url && item.cta_text)) && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: s.padding,
                      }}
                    >
                      {showSeparateTitle && (
                        <h2
                          style={{
                            color: s.titleColor,
                            fontSize: s.titleFontSize,
                            margin: 0,
                          }}
                        >
                          {item.title}
                        </h2>
                      )}
                      {bodyText && (
                        <p
                          style={{
                            color: s.textColor,
                            fontSize: s.textFontSize,
                            margin: showSeparateTitle ? '6px 0 0' : 0,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {bodyText}
                        </p>
                      )}
                      {item.link_url && item.cta_text && (
                        <a
                          href={item.link_url}
                          style={{
                            display: 'inline-block',
                            marginTop: '12px',
                            width: 'fit-content',
                            padding: '9px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            backgroundColor: s.buttonBg,
                            color: s.buttonColor,
                          }}
                        >
                          {item.cta_text}
                        </a>
                      )}
                    </div>
                  )}
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
                    minHeight: '140px',
                  }}
                >
                  {showSeparateTitle && (
                    <h2
                      style={{
                        fontSize: s.titleFontSize,
                        color: s.titleColor,
                        margin: '0 0 8px',
                      }}
                    >
                      {item.title}
                    </h2>
                  )}
                  {bodyText && (
                    <p
                      style={{
                        fontSize: s.textFontSize,
                        color: s.textColor,
                        maxWidth: '720px',
                        lineHeight: 1.6,
                        margin: 0,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {bodyText}
                    </p>
                  )}
                  {item.link_url && item.cta_text && (
                    <a
                      href={item.link_url}
                      style={{
                        display: 'inline-block',
                        marginTop: '14px',
                        padding: '9px 18px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '13px',
                        backgroundColor: s.buttonBg,
                        color: s.buttonColor,
                      }}
                    >
                      {item.cta_text}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {banners.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => scrollToSlide(idx)}
              style={{
                width: activeIndex === idx ? '16px' : '6px',
                height: '6px',
                borderRadius: '999px',
                border: 'none',
                padding: 0,
                backgroundColor: activeIndex === idx ? '#ffffff' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default BannerSlot;
