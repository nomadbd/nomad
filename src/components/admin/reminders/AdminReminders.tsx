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
    <div className="p-6 md:p-8 text-white max-w-4xl mx-auto font-sans">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#18181b] p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            ✨ Ethical Reminders
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage global and contextual loading verses & morals seamlessly.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-white text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-md text-sm active:scale-95"
        >
          {showForm ? '✕ Cancel' : '+ Add New Reminder'}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#18181b] border border-gray-700/60 p-6 md:p-8 rounded-2xl mb-8 shadow-2xl backdrop-blur-md animate-fadeIn">
          <h2 className="text-lg font-semibold mb-5 text-gray-200 border-b border-gray-800 pb-3">
            {editingId ? '✏️ Edit Reminder' : '➕ Create New Reminder'}
          </h2>

          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Content / Message *</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="আয়াত বা নৈতিক বাণী লিখুন..."
              className="w-full bg-[#111113] border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-white transition text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="যেমন: সূরা আন-নিসা: ৫৮"
                className="w-full bg-[#111113] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-white transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111113] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-white transition text-sm cursor-pointer"
              >
                <option value="global">Global</option>
                <option value="logistics">Logistics</option>
                <option value="orders">Orders</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-[#111113] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-white transition text-sm"
              />
            </div>
          </div>

          <div className="flex items-center mb-6 bg-[#111113] p-3.5 rounded-xl border border-gray-800 w-fit">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-white rounded cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-300 ml-3 cursor-pointer">Active Status</label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl bg-gray-800/80 text-gray-300 hover:bg-gray-700 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 text-sm transition shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        </form>
      )}

      {/* Reminders Feed (Social Media Style Cards) */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-sm tracking-wide">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-[#18181b] rounded-2xl border border-gray-800 shadow-inner">
          No reminders found. Create your first one above!
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((item) => (
            <div
              key={item.id}
              className="bg-[#18181b] border border-gray-800/80 hover:border-gray-700 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl group relative overflow-hidden"
            >
              {/* Top Meta info */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-300 uppercase tracking-wider border border-gray-700/50">
                    {item.category}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${item.is_active ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'}`}>
                    {item.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  Priority: {item.priority}
                </div>
              </div>

              {/* Main Content */}
              <p className="text-gray-100 text-base md:text-lg font-normal leading-relaxed my-3 font-serif">
                “{item.content}”
              </p>

              {/* Reference & Actions Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 mt-4 border-t border-gray-800/60">
                <div className="text-sm text-indigo-400 font-medium italic">
                  {item.reference ? `— ${item.reference}` : ''}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 rounded-lg transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg transition"
                  >
                    🗑️ Delete
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
