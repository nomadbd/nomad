import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Thread, Message } from './types';

export const useAdminMessages = (
  searchQuery: string,
  propActiveThreadId: string | null,
  onSelectThread?: (id: string | null, thread?: Thread | null) => void
) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [internalActiveThreadId, setInternalActiveThreadId] = useState<string | null>(propActiveThreadId);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    setInternalActiveThreadId(propActiveThreadId);
  }, [propActiveThreadId]);

  const activeThreadId = propActiveThreadId !== undefined && propActiveThreadId !== null ? propActiveThreadId : internalActiveThreadId;

  const handleSelectThread = (thread: Thread | null) => {
    const threadId = thread ? thread.id : null;
    setInternalActiveThreadId(threadId);
    if (onSelectThread) {
      onSelectThread(threadId, thread);
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchCommunicationsAndUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [commsRes, profilesRes, ambRes] = await Promise.all([
        supabase.from('communications').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('email, name, full_name, role, avatar_url, created_at'),
        supabase.from('ambassador').select('email, recipient_identifier, phone, invite_sent_at'),
      ]);

      if (commsRes.error) throw commsRes.error;

      const profileMap: Record<string, { name: string; role: string; avatarUrl?: string; createdAt?: string }> = {};
      if (profilesRes.data) {
        profilesRes.data.forEach((p: any) => {
          if (p.email) {
            profileMap[p.email.toLowerCase()] = {
              name: p.full_name || p.name || '',
              role: (p.role || 'CUSTOMER').toUpperCase(),
              avatarUrl: p.avatar_url || '',
              createdAt: p.created_at || '',
            };
          }
        });
      }

      const ambassadorMap: Record<string, { identifier: string; phone?: string; inviteSentAt?: string }> = {};
      if (ambRes.data) {
        ambRes.data.forEach((a: any) => {
          if (a.email) {
            ambassadorMap[a.email.toLowerCase()] = {
              identifier: a.recipient_identifier || '',
              phone: a.phone || '',
              inviteSentAt: a.invite_sent_at || '',
            };
          }
        });
      }

      if (commsRes.data) {
        const threadMap: { [key: string]: Thread } = {};

        commsRes.data.forEach((item: any) => {
          const isSenderAdmin = (item.sender_role || '').toLowerCase() === 'admin';
          const userEmail = (isSenderAdmin ? item.recipient_email : item.sender_email || '').toLowerCase();
          const threadId = item.channel_id || userEmail || 'general';

          const formattedTime = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          let displayName = userEmail;
          let userRole = 'GUEST';
          let userPhone = '';

          const profileData = profileMap[userEmail];
          const ambData = ambassadorMap[userEmail];

          if (profileData && profileData.name) {
            displayName = profileData.name;
            userRole = profileData.role;
          } else if (ambData) {
            displayName = ambData.identifier || displayName;
            userRole = 'INVITED AMBASSADOR';
            userPhone = ambData.phone || '';
          }

          if (ambData && ambData.phone) {
            userPhone = ambData.phone;
          }

          if (!threadMap[threadId]) {
            threadMap[threadId] = {
              id: threadId,
              userName: displayName,
              userEmail: userEmail,
              userPhone: userPhone,
              role: userRole,
              avatarUrl: profileData?.avatarUrl || '',
              createdAt: profileData?.createdAt || '',
              inviteSentAt: ambData?.inviteSentAt || '',
              unreadCount: item.is_read === false && !isSenderAdmin ? 1 : 0,
              lastMessage: item.message || '',
              lastMessageTime: formattedTime,
              messages: [],
            };
          } else {
            if (item.is_read === false && !isSenderAdmin) {
              threadMap[threadId].unreadCount += 1;
            }
          }

          threadMap[threadId].messages.push({
            id: item.id || String(Math.random()),
            sender: isSenderAdmin ? 'ADMIN' : 'USER',
            text: item.message || '',
            timestamp: formattedTime,
          });

          threadMap[threadId].lastMessage = item.message || '';
          threadMap[threadId].lastMessageTime = formattedTime;
        });

        const updatedThreads = Object.values(threadMap);
        setThreads(updatedThreads);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'FAILED TO LOAD COMMUNICATIONS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunicationsAndUsers();

    const channel = supabase
      .channel('public:communications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        fetchCommunicationsAndUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredThreads = threads.filter((t) => {
    const matchesRole = roleFilter === 'ALL' || t.role.toLowerCase().includes(roleFilter.toLowerCase());
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.userName.toLowerCase().includes(query) ||
      t.userEmail.toLowerCase().includes(query) ||
      t.lastMessage.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const handleSendMessage = async (e?: React.FormEvent, textareaRef?: React.RefObject<HTMLTextAreaElement>) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const messageText = inputText.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = String(Date.now());

    const newMsg: Message = {
      id: tempId,
      sender: 'ADMIN',
      text: messageText,
      timestamp: nowTime,
    };

    setThreads((prevThreads) =>
      prevThreads.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            lastMessage: messageText,
            lastMessageTime: nowTime,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    setInputText('');
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const { error } = await supabase.from('communications').insert([
        {
          sender_email: 'admin@nomadbd.com',
          sender_role: 'admin',
          recipient_email: activeThread.userEmail || null,
          message: messageText,
          channel_type: activeThread.role.toLowerCase(),
          channel_id: activeThread.id,
          is_read: false,
        },
      ]);

      if (error) {
        console.error('Send error:', error.message);
        fetchCommunicationsAndUsers();
      }
    } catch (err: any) {
      console.error('Send error:', err);
    }
  };

  return {
    threads,
    activeThreadId,
    activeThread,
    filteredThreads,
    roleFilter,
    setRoleFilter,
    inputText,
    setInputText,
    loading,
    errorMsg,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleSelectThread,
    handleSendMessage,
    fetchCommunicationsAndUsers,
  };
};
