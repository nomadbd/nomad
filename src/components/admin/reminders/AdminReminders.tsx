import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Reminder, AdminRemindersProps } from './types';
import CreateReminderModal from './CreateReminderModal';
import ReminderItem from './ReminderItem';

export default function AdminReminders({ searchQuery = '', isAddOpen = false, onCloseAdd }: AdminRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalShowForm, setInternalShowForm] = useState(false);

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

  const handleCreate = async ({ content, reference, category, is_active }: { content: string; reference: string; category: string; is_active: boolean }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('reminders')
      .insert([{
        content,
        reference,
        category,
        is_active,
        created_by: user?.id,
        updated_by: user?.id
      }]);

    if (!error) {
      fetchReminders();
      if (onCloseAdd) onCloseAdd();
      setInternalShowForm(false);
    } else {
      alert('Error creating reminder: ' + error.message);
    }
  };

  const handleUpdate = async (id: string, content: string, reference: string, category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('reminders')
      .update({
        content,
        reference,
        category,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('id', id);

    if (!error) {
      fetchReminders();
    } else {
      alert('Error updating reminder: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const oldData = reminders.find(r => r.id === id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('reminders').delete().eq('id', id);

    if (!error) {
      // সুপাবেজের audit_logs টেবিলে সঠিক user_id পাঠানো হলো যাতে অ্যাক্টিভিটি লগে নাম ও পদবী আসে
      await supabase.from('audit_logs').insert({
        entity_type: 'reminders',
        action_type: 'DELETE_REMINDER',
        user_id: user?.id, 
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
      <CreateReminderModal
        isOpen={showForm}
        onClose={() => {
          if (onCloseAdd) onCloseAdd();
          setInternalShowForm(false);
        }}
        onSave={handleCreate}
        reminders={reminders}
      />

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
          {filteredReminders.map((item) => (
            <ReminderItem
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
