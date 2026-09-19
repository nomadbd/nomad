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
  const [adminEmail, setAdminEmail] = useState<string>('');

  useEffect(() => {
    setInternalActiveThreadId(propActiveThreadId);
  }, [propActiveThreadId]);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setAdminEmail(user.email.trim().toLowerCase());
      }
    };
    fetchCurrentAdmin();
  }, []);

  const activeThreadId =
    propActiveThreadId !== undefined && propActiveThreadId !== null ? propActiveThreadId : internalActiveThreadId;

  const markThreadAsRead = async (thread: Thread) => {
    setThreads((prevThreads) =>
      prevThreads.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
    );

    try {
      // ইমেইল না থাকলেও channel_id (token) দিয়ে Read স্ট্যাটাস আপডেট হবে
      const { error } = await supabase
        .from('communications')
        .update({ is_read: true })
        .eq('channel_id', thread.id)
        .eq('is_read', false);

      if (error) {
        console.error('Failed to mark messages as read in DB:', error.message);
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const handleSelectThread = (thread: Thread | null) => {
    const threadId = thread ? thread.id : null;
    setInternalActiveThreadId(threadId);

    if (thread && thread.unreadCount > 0) {
      markThreadAsRead(thread);
    }

    if (onSelectThread) {
      onSelectThread(threadId, thread);
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchCommunicationsAndUsers = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setErrorMsg(null);

      const [commsRes, profilesRes, ambRes] = await Promise.all([
        supabase.from('communications').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('email, name, role, avatar_url, created_at'),
        supabase.from('ambassador').select('email, recipient_identifier, phone, assigned_slug, token, display_name, invite_sent_at'),
      ]);

      if (commsRes.error) throw commsRes.error;

      const profileMap: Record<string, { name: string; role: string; avatarUrl?: string; createdAt?: string }> = {};
      if (profilesRes.data) {
        profilesRes.data.forEach((p: any) => {
          if (p.email) {
            profileMap[p.email.trim().toLowerCase()] = {
              name: p.name || '',
              role: (p.role || 'CUSTOMER').toUpperCase(),
              avatarUrl: p.avatar_url || '',
              createdAt: p.created_at || '',
            };
          }
        });
      }

      const ambassadorMap: Record<string, { displayName: string; identifier: string; phone?: string; inviteSentAt?: string; email?: string; token?: string }> = {};
      if (ambRes.data) {
        ambRes.data.forEach((a: any) => {
          const ambDataObj = {
            displayName: a.display_name || '',
            identifier: a.recipient_identifier || a.email || a.assigned_slug || a.token || '',
            phone: a.phone || '',
            inviteSentAt: a.invite_sent_at || '',
            email: a.email ? a.email.trim().toLowerCase() : '',
            token: a.token || a.assigned_slug || '',
          };

          const possibleKeys = [a.email, a.recipient_identifier, a.assigned_slug, a.token, a.phone];
          possibleKeys.forEach((key) => {
            if (key && typeof key === 'string') {
              const cleanKey = key.trim().toLowerCase();
              if (cleanKey) ambassadorMap[cleanKey] = ambDataObj;
            }
          });
        });
      }

      if (commsRes.data) {
        const threadMap: { [key: string]: Thread } = {};

        commsRes.data.forEach((item: any) => {
          const isSenderAdmin = (item.sender_role || '').toLowerCase() === 'admin';
          
          let rawEmail = isSenderAdmin ? item.recipient_email : item.sender_email;
          if (rawEmail === 'EMPTY') rawEmail = '';

          const channelId = (item.channel_id || '').trim().toLowerCase();
          
          const profileData = rawEmail ? profileMap[rawEmail.trim().toLowerCase()] : null;
          const ambData = (channelId ? ambassadorMap[channelId] : null) || (rawEmail ? ambassadorMap[rawEmail.trim().toLowerCase()] : null);

          // Unique Thread ID নির্ধারণ: channel_id (token/slug) অগ্রাধিকার পাবে, না থাকলে Email
          const threadId = channelId || (rawEmail ? rawEmail.trim().toLowerCase() : 'general');
          const userEmail = rawEmail || ambData?.email || '';
          const rawCreatedAt = item.created_at || new Date().toISOString();

          const formattedTime = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          let displayName = ambData?.displayName || profileData?.name || userEmail || ambData?.phone || channelId || 'Guest';
          let userRole = profileData ? profileData.role : (ambData ? 'INVITED AMBASSADOR' : 'GUEST');
          let userPhone = ambData?.phone || '';

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
              lastMessageTime: rawCreatedAt,
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
          threadMap[threadId].lastMessageTime = rawCreatedAt;
        });

        const updatedThreads = Object.values(threadMap).sort((a, b) => {
          const timeA = new Date(a.lastMessageTime).getTime();
          const timeB = new Date(b.lastMessageTime).getTime();
          return timeB - timeA;
        });

        setThreads(updatedThreads);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'FAILED TO LOAD COMMUNICATIONS');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunicationsAndUsers(false);

    const channel = supabase
      .channel('public:communications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        fetchCommunicationsAndUsers(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredThreads = threads.filter((t) => {
    const threadRole = (t.role || '').toLowerCase();
    const currentRoleFilter = (roleFilter || 'ALL').toLowerCase();
    const matchesRole = roleFilter === 'ALL' || threadRole.includes(currentRoleFilter);
    const query = searchQuery.trim().toLowerCase();

    const userName = (t.userName || '').toLowerCase();
    const userEmail = (t.userEmail || '').toLowerCase();
    const userPhone = (t.userPhone || '').toLowerCase();
    const lastMsg = (t.lastMessage || '').toLowerCase();

    const matchesSearch =
      !query ||
      userName.includes(query) ||
      userEmail.includes(query) ||
      userPhone.includes(query) ||
      lastMsg.includes(query);

    return matchesRole && matchesSearch;
  });

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const handleSendMessage = async (e?: React.FormEvent, textareaRef?: React.RefObject<HTMLTextAreaElement>) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const messageText = inputText.trim();
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = String(Date.now());

    const newMsg: Message = {
      id: tempId,
      sender: 'ADMIN',
      text: messageText,
      timestamp: nowTime,
    };

    setThreads((prevThreads) => {
      const updated = prevThreads.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            lastMessage: messageText,
            lastMessageTime: nowIso,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      });

      return updated.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    });

    setInputText('');
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // এডমিন থেকে পাঠানো মেসেজে channel_id বাধ্যতামূলকভাবে activeThread.id (token/slug) হবে
      const { error } = await supabase.from('communications').insert([
        {
          sender_email: adminEmail || 'admin@nomadbd.com',
          sender_role: 'admin',
          recipient_email: activeThread.userEmail || null,
          message: messageText,
          channel_type: (activeThread.role || '').toLowerCase(),
          channel_id: activeThread.id, // <--- Token/Slug Here!
          is_read: true,
        },
      ]);

      if (error) {
        console.error('Send error:', error.message);
        fetchCommunicationsAndUsers(true);
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
