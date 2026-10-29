import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

interface Reminder {
  id: string;
  content: string;
  reference: string;
  category: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export default function AdminReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('global');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);

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
    } else {
      setReminders(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setContent('');
    setReference('');
    setCategory('global');
    setIsActive(true);
    setPriority(1);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setContent(reminder.content);
    setReference(reminder.reference || '');
    setCategory(reminder.category || 'global');
    setIsActive(reminder.is_active);
    setPriority(reminder.priority || 1);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (editingId) {
      const oldData = reminders.find(r => r.id === editingId);
      const { error } = await supabase
        .from('reminders')
        .update({
          content,
          reference,
          category,
          is_active: isActive,
          priority,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', editingId);

      if (!error) {
        await supabase.from('audit_logs').insert({
          entity_type: 'reminders',
          action_type: 'UPDATE_REMINDER',
          performed_by: user?.id,
          changes: { old: oldData, new: { content, reference, category, is_active: isActive } },
          metadata: { category, reference }
        });
        fetchReminders();
        resetForm();
      } else {
        alert('Error updating reminder: ' + error.message);
      }
    } else {
      const { data: newReminder, error } = await supabase
        .from('reminders')
        .insert([{
          content,
          reference,
          category,
          is_active: isActive,
          priority,
          created_by: user?.id,
          updated_by: user?.id
        }])
        .select()
        .single();

      if (!error) {
        await supabase.from('audit_logs').insert({
          entity_type: 'reminders',
          action_type: 'CREATE_REMINDER',
          performed_by: user?.id,
          changes: { new: newReminder },
          metadata: { category, reference }
        });
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
      await supabase.from('audit_logs').insert({
        entity_type: 'reminders',
        action_type: 'DELETE_REMINDER',
        performed_by: user?.id,
        changes: { old: oldData },
        metadata: { reminder_id: id }
      });
      fetchReminders();
    } else {
      alert('Error deleting reminder: ' + error.message);
    }
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
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #30303b',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#b0b0bc',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
          }}
        >
          Ethical Reminders
        </span>

        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{
            backgroundColor: showForm ? '#3a3a46' : '#ffffff',
            color: showForm ? '#ffffff' : '#000000',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.8px',
            cursor: 'pointer',
          }}
        >
          {showForm ? 'CANCEL' : '+ ADD NEW'}
        </button>
      </div>

      {/* Inline Form */}
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
          <span
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#b0b0bc',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderBottom: '1px solid #2d2d38',
              paddingBottom: '8px',
            }}
          >
            {editingId ? 'Edit Reminder' : 'Create New Reminder'}
          </span>

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#aaa', fontWeight: '500' }}>Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
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

      {/* Reminders List */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#888888', fontSize: '11px', fontFamily: 'monospace' }}>
          LOADING REMINDERS...
        </div>
      ) : reminders.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#888888', fontSize: '11px', fontFamily: 'monospace' }}>
          NO REMINDERS FOUND
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
          {reminders.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#1a1a20',
                border: '1px solid #2d2d38',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', borderBottom: '1px solid #262630', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#b0b0bc', textTransform: 'uppercase' }}>{item.category}</span>
                  <span style={{ backgroundColor: item.is_active ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: item.is_active ? '#2ecc71' : '#e74c3c', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>
                    {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <span style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>Priority: {item.priority}</span>
              </div>

              <p style={{ fontSize: '13px', color: '#e0e0e6', margin: '2px 0', lineHeight: '1.4' }}>
                {item.content}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #262630', fontSize: '11px' }}>
                <span style={{ color: '#3498db', fontStyle: 'italic', fontSize: '11px' }}>
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
                      padding: '3px 8px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
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
          ))}
        </div>
      )}
    </div>
  );
}
