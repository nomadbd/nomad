import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { BannerPostModal } from './BannerPostModal';
import { BannerListItem, BannerRecord } from './BannerListItem';

interface BannerManagerProps {
  isAddOpen?: boolean;
  onCloseAdd?: () => void;
}

export const BannerManager: React.FC<BannerManagerProps> = ({
  isAddOpen = false,
  onCloseAdd = () => {},
}) => {
  const [banners, setBanners] = useState<BannerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBanners(data as BannerRecord[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return (
    <div
      style={{
        padding: '14px 12px',
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
            {banners.length} posts
          </span>
        </div>

        <BannerPostModal
          isOpen={isAddOpen}
          onClose={onCloseAdd}
          onSaved={fetchBanners}
        />

        {loading ? (
          <p style={{ color: '#71717a', fontSize: '13px', textAlign: 'center', margin: '16px 0' }}>
            Loading...
          </p>
        ) : banners.length === 0 ? (
          <div
            style={{
              backgroundColor: '#0d0d10',
              border: '1px solid #222226',
              borderRadius: '11px',
              padding: '20px 12px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#71717a',
            }}
          >
            No posts yet. Tap + in header to create one.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {banners.map((item) => (
              <BannerListItem
                key={item.id}
                item={item}
                onChanged={fetchBanners}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManager;
