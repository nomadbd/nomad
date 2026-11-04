import React, { useState } from 'react';
import { EditIcon } from '../../icons';
import { Reminder } from './types';
import { CATEGORIES } from './constants';

interface ReminderItemProps {
  item: Reminder;
  onUpdate: (id: string, content: string, reference: string, category: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ReminderItem({ item, onUpdate, onDelete }: ReminderItemProps) {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineContent, setInlineContent] = useState(item.content);
  const [inlineReference, setInlineReference] = useState(item.reference || '');
  const [inlineCategory, setInlineCategory] = useState(item.category || 'global');
  const [isModified, setIsModified] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdited = item.updated_at && item.created_at && new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 1000;
  const userName = item.profiles?.name || 'Admin User';
  const userAvatar = item.profiles?.avatar_url;

  const handleStartEdit = () => {
    setIsInlineEditing(true);
    setInlineContent(item.content);
    setInlineReference(item.reference || '');
    setInlineCategory(item.category || 'global');
    setIsModified(false);
    setIsConfirmingDelete(false);
  };

  const handleSaveEdit = async () => {
    if (!inlineContent.trim()) return;
    setSaving(true);
    await onUpdate(item.id, inlineContent, inlineReference, inlineCategory);
    setSaving(false);
    setIsInlineEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingBottom: '16px',
        borderBottom: '1px solid #27272a',
      }}
    >
      {isInlineEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#3498db', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            EDITING MODE
          </span>
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
              const isSelected = inlineCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setInlineCategory(cat);
                    setIsModified(true);
                  }}
                  style={{
                    backgroundColor: isSelected ? '#ffffff' : '#18181b',
                    color: isSelected ? '#000000' : '#a1a1aa',
                    border: '1px solid #27272a',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '10px',
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
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #3f3f46' }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#27272a',
                  color: '#e4e4e7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: '1px solid #3f3f46',
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                {userName}
              </span>
              <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.profiles?.designation || item.category}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
            <span style={{ color: '#a1a1aa' }}>{formatDate(item.created_at)}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <span>{formatTime(item.created_at)}</span>
              {isEdited && <span style={{ color: '#71717a', fontSize: '9px' }}>· Edited</span>}
            </div>
          </div>
        </div>
      )}

      {isInlineEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
          <textarea
            rows={3}
            value={inlineContent}
            onChange={(e) => {
              setInlineContent(e.target.value);
              setIsModified(true);
            }}
            placeholder="Write something..."
            style={{
              backgroundColor: '#09090b',
              color: '#ffffff',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '10px 14px',
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <input
            type="text"
            value={inlineReference}
            onChange={(e) => {
              setInlineReference(e.target.value);
              setIsModified(true);
            }}
            placeholder="Reference (optional)"
            style={{
              backgroundColor: '#09090b',
              color: '#ffffff',
              border: '1px solid #27272a',
              borderRadius: '20px',
              padding: '8px 14px',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '14px', color: '#e4e4e7', margin: '4px 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {item.content}
          </p>
          {item.reference && (
            <div style={{ borderTop: '1px solid #222226', paddingTop: '4px', width: 'fit-content' }}>
              <span style={{ color: '#a1a1aa', fontWeight: '600', fontSize: '12px' }}>
                {item.reference}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', fontSize: '11px' }}>
        {isInlineEditing ? (
          <span style={{ fontSize: '10px', color: '#71717a', fontStyle: 'italic' }}>
            {isModified ? 'Unsaved changes...' : 'Ready to edit...'}
          </span>
        ) : (
          <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Category: {item.category}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isInlineEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsInlineEditing(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #3f3f46',
                  color: '#a1a1aa',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {saving ? '...' : 'Update'}
              </button>
            </div>
          ) : isConfirmingDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <span style={{ fontSize: '10px', color: '#f87171', fontWeight: '600' }}>Delete?</span>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartEdit}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Edit Reminder"
              >
                <EditIcon size={14} color="#e4e4e7" />
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
