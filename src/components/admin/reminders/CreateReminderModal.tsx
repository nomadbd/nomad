import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../../icons';
import { CATEGORIES } from './constants';
import { Reminder } from './types';

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: { content: string; reference: string; category: string; is_active: boolean }) => Promise<void>;
  reminders: Reminder[];
}

export default function CreateReminderModal({ isOpen, onClose, onSave, reminders }: CreateReminderModalProps) {
  const [content, setContent] = useState('');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('global');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!content.trim()) {
      setDuplicateWarning(null);
      return;
    }

    const exactMatch = reminders.find(
      r => r.content.trim().toLowerCase() === content.trim().toLowerCase()
    );

    if (exactMatch) {
      setDuplicateWarning('Already exists!');
    } else {
      setDuplicateWarning(null);
    }
  }, [content, reminders]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || duplicateWarning) return;

    setSaving(true);
    await onSave({ content, reference, category, is_active: isActive });
    setSaving(false);
    setContent('');
    setReference('');
    setCategory('global');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#0f0f13',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          backgroundColor: '#0f0f13',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid #27272a',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.3px' }}>
          New Reminder
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {duplicateWarning ? (
            <div
              style={{
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
              }}
            >
              {duplicateWarning}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !content.trim()}
              style={{
                backgroundColor: content.trim() ? '#ffffff' : '#3f3f46',
                color: content.trim() ? '#000000' : '#a1a1aa',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: content.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? 'POSTING...' : 'Post'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close"
          >
            <CloseIcon size={18} color="#ffffff" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '500' }}>Select Category</label>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none',
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        backgroundColor: isSelected ? '#ffffff' : '#18181b',
                        color: isSelected ? '#000000' : '#a1a1aa',
                        border: '1px solid #27272a',
                        borderRadius: '16px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="What's on your mind? Write something..."
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: '1.5',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #27272a', paddingTop: '14px' }}>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Add source / reference (optional)"
                style={{
                  backgroundColor: '#16161a',
                  color: '#ffffff',
                  border: '1px solid #27272a',
                  borderRadius: '20px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
