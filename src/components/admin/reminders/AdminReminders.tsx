import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { EditIcon } from '../../../components/icons';

interface Reminder {
  id: string;
  content: string;
  reference: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  profiles?: {
    name: string;
    designation: string;
    avatar_url?: string | null;
  };
}

interface AdminRemindersProps {
  searchQuery?: string;
  isAddOpen?: boolean;
  onCloseAdd?: () => void;
}

const CATEGORIES = [
  'global',
  'overview',
  'orders',
  'products',
  'logistics',
  'messages',
  'notifications',
  'reminders',
  'ambassadors',
  'staff',
  'customers',
  'activity logs'
];

export default function AdminReminders({ searchQuery = '', isAddOpen = false, onCloseAdd }: AdminRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [internalShowForm, setInternalShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('global');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // ইনলাইন এডিটিং ট্র্যাক করার জন্য স্টেট
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineContent, setInlineContent] = useState('');
  const [inlineReference, setInlineReference] = useState('');
  const [inlineCategory, setInlineCategory] = useState('global');
  const [isModified, setIsModified] = useState(false);

  // ডিলিট কনফার্মেশন ট্র্যাক করার জন্য স্টেট
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showForm = isAddOpen || internalShowForm;

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reminders:', error.message);
      setReminders([]);
    } else if (data && data.length > 0) {
      const enhancedReminders = await Promise.all(
        data.map(async (item) => {
          if (item.created_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, designation, avatar_url')
              .eq('id', item.created_by)
              .single();
            return {
              ...item,
              profiles: profileData || { name: 'Admin User', designation: item.category, avatar_url: null }
            };
          }
          return { ...item, profiles: { name: 'Admin User', designation: item.category, avatar_url: null } };
        })
      );
      setReminders(enhancedReminders);
    } else {
      setReminders([]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setContent('');
    setReference('');
    setCategory('global');
    setIsActive(true);
    setInternalShowForm(false);
    if (onCloseAdd) onCloseAdd();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('reminders')
      .insert([{
        content,
        reference,
        category,
        is_active: isActive,
        created_by: user?.id,
        updated_by: user?.id
      }]);

    if (!error) {
      fetchReminders();
      resetForm();
    } else {
      alert('Error creating reminder: ' + error.message);
    }
    setSaving(false);
  };

  const handleStartInlineEdit = (reminder: Reminder) => {
    setInlineEditingId(reminder.id);
    setInlineContent(reminder.content);
    setInlineReference(reminder.reference || '');
    setInlineCategory(reminder.category || 'global');
    setIsModified(false);
    setDeleteConfirmId(null);
  };

  const handleInlineSubmit = async (id: string) => {
    if (!inlineContent.trim()) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('reminders')
      .update({
        content: inlineContent,
        reference: inlineReference,
        category: inlineCategory,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('id', id);

    if (!error) {
      setInlineEditingId(null);
      fetchReminders();
    } else {
      alert('Error updating reminder: ' + error.message);
    }
    setSaving(false);
  };

  const handleDeleteConfirmed = async (id: string) => {
    const oldData = reminders.find(r => r.id === id);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('reminders').delete().eq('id', id);

    if (!error) {
      await supabase.from('audit_logs').insert({
        entity_type: 'reminders',
        action_type: 'DELETE_REMINDER',
        performed_by: user?.id,
        changes: { old: oldData },
        metadata: { reminder_id: id, content: oldData?.content }
      });
      setDeleteConfirmId(null);
      fetchReminders();
    } else {
      alert('Error deleting reminder: ' + error.message);
    }
  };

  const filteredReminders = reminders.filter((item) => {
    const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
    if (!query) return true;

    const contentMatch = item.content && item.content.toLowerCase().includes(query);
    const referenceMatch = item.reference && item.reference.toLowerCase().includes(query);
    const categoryMatch = item.category && item.category.toLowerCase().includes(query);

    return contentMatch || referenceMatch || categoryMatch;
  });

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
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'transparent',
        padding: '8px 0',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Creation Inline Form (Top) */}
      {showForm && (
        <form
          onSubmit={handleCreateSubmit}
          style={{
            backgroundColor: '#16161a',
            border: '1px solid #27272a',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#a1a1aa', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Create New Reminder
            </span>
            <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '500' }}>Content / Message *</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="আয়াত বা নৈতিক বাণী লিখুন..."
              style={{ backgroundColor: '#09090b', color: '#ffffff', border: '1px solid #27272a', borderRadius: '16px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '500' }}>Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="যেমন: সূরা আন-নিসা: ৫৮"
                style={{ backgroundColor: '#09090b', color: '#ffffff', border: '1px solid #27272a', borderRadius: '20px', padding: '8px 12px', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '500' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ backgroundColor: '#09090b', color: '#ffffff', border: '1px solid #27272a', borderRadius: '20px', padding: '8px 12px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            <label htmlFor="isActive" style={{ fontSize: '12px', color: '#d4d4d8', cursor: 'pointer' }}>Active Status</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #27272a', paddingTop: '8px' }}>
            <button type="button" onClick={resetForm} style={{ backgroundColor: 'transparent', border: '1px solid #3f3f46', color: '#a1a1aa', borderRadius: '20px', padding: '6px 14px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '20px', padding: '6px 16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </form>
      )}

      {/* Reminders Free Feed */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>
          LOADING REMINDERS...
        </div>
      ) : filteredReminders.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>
          NO REMINDERS FOUND
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredReminders.map((item) => {
            const isEdited = item.updated_at && item.created_at && new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 1000;
            const userName = item.profiles?.name || 'Admin User';
            const userAvatar = item.profiles?.avatar_url;
            const isInlineEditing = inlineEditingId === item.id;
            const isConfirmingDelete = deleteConfirmId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #27272a',
                }}
              >
                {/* Header Layout: Normal vs Editing Mode with Horizontal Scrolling Categories */}
                {isInlineEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#3498db', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                       EDITING MODE
                    </span>
                    {/* ডানে-বামে স্ক্রোলযোগ্য ক্যাটাগরি ট্যাব বার */}
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
                    {/* Left Column: Avatar + Name & Designation */}
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

                    {/* Right Column: Date & Time */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                      <span style={{ color: '#a1a1aa' }}>{formatDate(item.created_at)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>{formatTime(item.created_at)}</span>
                        {isEdited && <span style={{ color: '#71717a', fontSize: '9px' }}>· Edited</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content / Inline Edit Form (মুক্ত লেআউট ও স্কেলিটন আন্ডারলাইন স্টাইল) */}
                {isInlineEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
                    <textarea
                      rows={3}
                      value={inlineContent}
                      onChange={(e) => {
                        setInlineContent(e.target.value);
                        setIsModified(true);
                      }}
                      placeholder="আয়াত বা বাণী লিখুন..."
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
                      placeholder="Reference (যেমন: সূরা আন-নিসা: ৫৮)"
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

                {/* Footer Actions (যেখানে সময় বা রেফারেন্স থাকে, ঠিক সেখানেই আপডেট/ক্যানসেল বাটন দৃশ্যমান হবে) */}
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
                          onClick={() => setInlineEditingId(null)}
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
                          onClick={() => handleInlineSubmit(item.id)}
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
                          onClick={() => handleDeleteConfirmed(item.id)}
                          style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartInlineEdit(item)}
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
                          onClick={() => setDeleteConfirmId(item.id)}
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
          })}
        </div>
      )}
    </div>
  );
}
