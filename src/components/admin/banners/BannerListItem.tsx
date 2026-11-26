import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';

export interface BannerRecord {
  id: string;
  type?: 'image' | 'article';
  media_type?: 'text' | 'image' | 'video' | null;
  title: string;
  subtitle?: string | null;
  article_body?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  link_url?: string | null;
  cta_text?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
}

const toInputDatetime = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface BannerListItemProps {
  item: BannerRecord;
  onChanged: () => void;
}

export const BannerListItem: React.FC<BannerListItemProps> = ({
  item,
  onChanged,
}) => {
  const [editingSchedule, setEditingSchedule] = useState<boolean>(false);
  const [startVal, setStartVal] = useState<string>(toInputDatetime(item.start_date));
  const [endVal, setEndVal] = useState<string>(toInputDatetime(item.end_date));
  const [saving, setSaving] = useState<boolean>(false);

  const isActive = item.is_active ?? true;

  const handleToggleActive = async () => {
    await supabase
      .from('banners')
      .update({ is_active: !isActive })
      .eq('id', item.id);
    onChanged();
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    await supabase
      .from('banners')
      .update({
        start_date: startVal ? new Date(startVal).toISOString() : null,
        end_date: endVal ? new Date(endVal).toISOString() : null,
      })
      .eq('id', item.id);
    setSaving(false);
    setEditingSchedule(false);
    onChanged();
  };

  const handleDelete = async () => {
    await supabase.from('banners').delete().eq('id', item.id);
    onChanged();
  };

  return (
    <article
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: isActive ? '#4ade80' : '#a1a1aa',
            }}
          >
            {isActive ? '● Active' : '○ Paused'}
          </span>
          <span style={{ fontSize: '11px', color: '#71717a' }}>
            Posted: {formatDateTime(item.created_at)}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#71717a' }}>
          #{item.sort_order ?? 0}
        </span>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '2px' }}>
        {item.title}
      </div>

      {item.subtitle && (
        <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#a1a1aa', lineHeight: 1.45 }}>
          {item.subtitle}
        </p>
      )}

      {item.article_body && (
        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#d4d4d8', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {item.article_body}
        </p>
      )}

      {item.video_url && (
        <video
          src={item.video_url}
          controls
          style={{
            width: '100%',
            maxHeight: '200px',
            borderRadius: '8px',
            border: '1px solid #222226',
            marginTop: '4px',
            marginBottom: '8px',
            display: 'block',
          }}
        />
      )}

      {!item.video_url && item.image_url && (
        <img
          src={item.image_url}
          alt={item.title}
          style={{
            width: '100%',
            maxHeight: '185px',
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #222226',
            marginTop: '4px',
            marginBottom: '8px',
            display: 'block',
          }}
        />
      )}

      <div
        style={{
          fontSize: '11px',
          color: '#8e8e99',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '8px',
        }}
      >
        <span>Start: {formatDateTime(item.start_date)}</span>
        <span>End: {formatDateTime(item.end_date)}</span>
      </div>

      {editingSchedule && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: '#111114',
            border: '1px solid #222226',
            marginBottom: '8px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: '#71717a', marginBottom: '3px' }}>Start</div>
            <input
              type="datetime-local"
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid #27272a',
                backgroundColor: '#0d0d10',
                color: '#f4f4f5',
                fontSize: '11px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#71717a', marginBottom: '3px' }}>End</div>
            <input
              type="datetime-local"
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid #27272a',
                backgroundColor: '#0d0d10',
                color: '#f4f4f5',
                fontSize: '11px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setEditingSchedule(false)}
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                border: '1px solid #27272a',
                backgroundColor: 'transparent',
                color: '#a1a1aa',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSchedule}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#fafafa',
                color: '#09090b',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Time'}
            </button>
          </div>
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
          onClick={() => setEditingSchedule((v) => !v)}
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
          Schedule
        </button>
        <button
          type="button"
          onClick={handleToggleActive}
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
          {isActive ? 'Disable' : 'Activate'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
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
  );
};
