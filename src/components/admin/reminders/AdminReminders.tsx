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
  
  // ইনলাইন ফর্ম স্টেট
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
      // UPDATE
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
        // Audit Log Entry
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
      // CREATE
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
        // Audit Log Entry
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
      // Audit Log Entry
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
    <div className="p-6 text-white max-w-5xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Ethical Reminders</h1>
          <p className="text-gray-400 text-sm">Manage global and contextual loading verses & morals.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition"
        >
          {showForm ? 'Cancel' : '+ Add New Reminder'}
        </button>
      </div>

      {/* Inline Form (No Modal) */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-gray-800 p-5 rounded-lg mb-8 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Reminder' : 'Create New Reminder'}
          </h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Content / Message *</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="আয়াত বা নৈতিক বাণী লিখুন..."
              className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="যেমন: সূরা আন-নিসা: ৫৮"
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-white"
              >
                <option value="global">Global</option>
                <option value="logistics">Logistics</option>
                <option value="orders">Orders</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="mr-2 w-4 h-4 accent-white"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">Active Status</label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded bg-white text-black font-medium hover:bg-gray-200"
            >
              {saving ? 'Saving...' : editingId ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        </form>
      )}

      {/* Reminders List Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-[#121212] rounded-lg border border-gray-800">
          No reminders found. Create your first one above!
        </div>
      ) : (
        <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Content</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {reminders.map((item) => (
                <tr key={item.id} className="hover:bg-gray-900/50 transition">
                  <td className="p-4 max-w-md">
                    <p className="text-gray-100 font-normal">{item.content}</p>
                  </td>
                  <td className="p-4 text-gray-400">{item.reference || '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-300 uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded ${item.is_active ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="text-gray-400 hover:text-white px-2 py-1 text-xs border border-gray-700 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-300 px-2 py-1 text-xs border border-red-900 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
