 import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { EditIcon, CloseIcon } from '../../../components/icons';

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

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineContent, setInlineContent] = useState('');
  const [inlineReference, setInlineReference] = useState('');
  const [inlineCategory, setInlineCategory] = useState('global');
  const [isModified, setIsModified] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // visualViewport স্টেট (কিবোর্ড হ্যান্ডলিং)
  const [viewport, setViewport] = useState({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    offsetTop: 0,
  });

  const showForm = isAddOpen || internalShowForm;

  useEffect(() => {
    fetchReminders();
  }, []);

  // মডাল খোলা থাকলে বডি স্ক্রল লক
  useEffect(() => {
    if (showForm) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showForm]);

  // visualViewport লিসেনার
  useEffect(() => {
    if (!showForm) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const updateViewport = () => {
      setViewport({
        height: vv.height,
        offsetTop: vv.offsetTop,
      });
    };

    updateViewport();
    vv.addEventListener('resize', updateViewport);
    vv.addEventListener('scroll', updateViewport);

    return () => {
      vv.removeEventListener('resize', updateViewport);
      vv.removeEventListener('scroll', updateViewport);
    };
  }, [showForm]);

  // ডুপ্লিকেট চেক
  useEffect(() => {
    if (!content.trim() && !reference.trim()) {
      setDuplicateWarning(null);
      return;
    }

    const matchedContent = reminders.find(
      r => content.trim() && r.content.toLowerCase().includes(content.trim().toLowerCase())
    );
    const matchedReference = reminders.find(
      r => reference.trim() && r.reference && r.reference.toLowerCase() === reference.trim().toLowerCase()
    );

    if (matchedReference) {
      setDuplicateWarning(`This reference already exists in another post!`);
    } else if (matchedContent) {
      setDuplicateWarning(`A similar post or content already exists.`);
    } else {
      setDuplicateWarning(null);
    }
  }, [content, reference, reminders]);

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
    setDuplicateWarning(null);
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
      {/* ফুল-স্ক্রিন মডাল */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: viewport.offsetTop,
            left: 0,
            width: '100%',
            height: viewport.height,
            backgroundColor: '#0f0f13',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden',
            overscrollBehavior: 'none', // ঝাকুনি বন্ধ
          }}
        >
          {/* স্থির হেডার */}
          <div
            style={{
              flexShrink: 0,
              backgroundColor: '#0f0f13',
              zIndex: 30,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid #27272a',
              minHeight: '56px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.3px' }}>
              New Reminder
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={saving || !content.trim()}
                style={{
                  backgroundColor: content.trim() ? '#ffffff' : '#3f3f46',
                  color: content.trim() ? '#000000' : '#a1a1aa',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: content.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                {saving ? 'POSTING...' : 'Post'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close"
              >
                <CloseIcon size={18} color="#ffffff" />
              </button>
            </div>
          </div>

          {/* স্ক্রোলযোগ্য বডি */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'none', // ঝাকুনি বন্ধ
              padding: '16px',
              paddingBottom: '40px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* ক্যাটাগরি */}
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

                {/* কনটেন্ট */}
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
                      width: '100%',
                    }}
                  />
                </div>

                {/* রেফারেন্স */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    borderTop: '1px solid #27272a',
                    paddingTop: '14px',
                  }}
                >
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
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {duplicateWarning && (
                  <div
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#f87171',
                      fontSize: '12px',
                      lineHeight: '1.4',
                    }}
                  >
                    {duplicateWarning}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reminders Feed */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>
          LOADING REMINDERS...
        </div>
      ) : filteredReminders.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>
          NO REMINDERS FOUND
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '600px',
            overflowY: 'auto',
            paddingRight: '4px',
            overscrollBehavior: 'none',
          }}
        >
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
                        width: '100%',
                        boxSizing: 'border-box',
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
                        width: '100%',
                        boxSizing: 'border-box',
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
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