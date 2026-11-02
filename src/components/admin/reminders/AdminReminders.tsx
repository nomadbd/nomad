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
  };
}

interface AdminRemindersProps {
  searchQuery?: string;
  isAddOpen?: boolean;
  onCloseAdd?: () => void;
}

export default function AdminReminders({ searchQuery = '', isAddOpen = false, onCloseAdd }: AdminRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [internalShowForm, setInternalShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('global');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const showForm = isAddOpen || internalShowForm;

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    // প্রথমে নিরাপদভাবে reminders টেবিল থেকে সব ডাটা ফেচ করা হচ্ছে
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reminders:', error.message);
      setReminders([]);
    } else if (data && data.length > 0) {
      // প্রতিটি রিমাইন্ডারের জন্য প্রোফাইল বা ক্রিয়েটরের তথ্য নিরাপদভাবে আলাদাভাবে ফেচ করে যুক্ত করা হচ্ছে
      const enhancedReminders = await Promise.all(
        data.map(async (item) => {
          if (item.created_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, designation')
              .eq('id', item.created_by)
              .single();
            return {
              ...item,
              profiles: profileData || { name: 'Admin User', designation: item.category }
            };
          }
          return { ...item, profiles: { name: 'Admin User', designation: item.category } };
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
    setEditingId(null);
    setInternalShowForm(false);
    if (onCloseAdd) onCloseAdd();
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setContent(reminder.content);
    setReference(reminder.reference || '');
    setCategory(reminder.category || 'global');
    setIsActive(reminder.is_active);
    setInternalShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (editingId) {
      const { error } = await supabase
        .from('reminders')
        .update({
          content,
          reference,
          category,
          is_active: isActive,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', editingId);

      if (!error) {
        fetchReminders();
        resetForm();
      } else {
        alert('Error updating reminder: ' + error.message);
      }
    } else {
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
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    const oldData = reminders.find(r => r.id === id);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('reminders').delete().eq('id', id);

    if (!error) {
      // সেন্ট্রাল অডিট লগে ডিলিট ইনফো এন্ট্রি করা হচ্ছে যাতে অ্যাক্টিভিটি ট্যাবে দেখা যায়
      await supabase.from('audit_logs').insert({
        entity_type: 'reminders',
        action_type: 'DELETE_REMINDER',
        performed_by: user?.id,
        changes: { old: oldData },
        metadata: { reminder_id: id, content: oldData?.content }
      });
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
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#222228',
        border: '1px solid #363642',
        borderRadius: '12px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Inline Form (Creation/Edit Card) */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#1a1a20',
            border: '1px solid #363642',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d2d38', paddingBottom: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                color: '#b0b0bc',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {editingId ? 'Edit Reminder' : 'Create New Reminder'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>Content / Message *</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="আয়াত বা নৈতিক বাণী লিখুন..."
              style={{
                backgroundColor: '#141418',
                color: '#ffffff',
                border: '1px solid #363642',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="যেমন: সূরা আন-নিসা: ৫৮"
                style={{
                  backgroundColor: '#141418',
                  color: '#ffffff',
                  border: '1px solid #363642',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  backgroundColor: '#141418',
                  color: '#ffffff',
                  border: '1px solid #363642',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="global">Global</option>
                <option value="logistics">Logistics</option>
                <option value="orders">Orders</option>
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
            <label htmlFor="isActive" style={{ fontSize: '12px', color: '#ccc', cursor: 'pointer' }}>Active Status</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #2d2d38', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={resetForm}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #444452',
                color: '#aaa',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 14px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {saving ? 'SAVING...' : editingId ? 'UPDATE' : 'SAVE'}
            </button>
          </div>
        </form>
      )}

      {/* Reminders Feed (Facebook/X Style Cards) */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#888888', fontSize: '11px', fontFamily: 'monospace' }}>
          LOADING REMINDERS...
        </div>
      ) : filteredReminders.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#888888', fontSize: '11px', fontFamily: 'monospace' }}>
          NO REMINDERS FOUND
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredReminders.map((item) => {
            const isEdited = item.updated_at && item.created_at && new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 1000;
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1a1a20',
                  border: '1px solid #2d2d38',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Facebook Post Style Header: Name & Designation on Left, Timestamp on Right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #262630', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                      {item.profiles?.name || 'Admin User'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#888892', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.profiles?.designation || item.category}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#777782', fontFamily: 'monospace' }}>
                    <div>{formatDate(item.created_at)}</div>
                    {isEdited && <div style={{ color: '#3498db', fontSize: '9px', fontStyle: 'italic' }}>(Edited)</div>}
                  </div>
                </div>

                {/* Main Content */}
                <p style={{ fontSize: '14px', color: '#e0e0e6', margin: '4px 0', lineHeight: '1.5' }}>
                  {item.content}
                </p>

                {/* Reference & Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #262630', fontSize: '11px' }}>
                  <span style={{ color: '#3498db', fontStyle: 'italic', fontSize: '12px' }}>
                    {item.reference ? `— ${item.reference}` : ''}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleEditClick(item)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #444',
                        color: '#ccc',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Edit Reminder"
                    >
                      <EditIcon width={13} height={13} stroke="#ccc" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #7f1d1d',
                        color: '#f87171',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
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
